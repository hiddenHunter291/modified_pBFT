const express = require('express');
const sha256 = require('sha256')
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const Node = require('./node')
const rp = require('request-promise');
const { json } = require('body-parser');
const readline = require('readline');
const { Console } = require('console');
const { response } = require('express');

const medicalChain = new Blockchain();
const node = new Node()
const app = express();
const port = process.argv[2];
const MASTER_NODE = 'http://localhost:3000'

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/blockchain', function(request,response) {
    response.send(medicalChain)
});

//assign consensus nodes and candidate nodes
app.post('/shuffleNodes', function(request, response) {
    let counter = 1
    medicalChain.networkNodes.forEach(networkNodeUrl => {
        if((counter & 1) && medicalChain.consensusNodeSet.indexOf(networkNodeUrl) == -1) medicalChain.consensusNodeSet.push(networkNodeUrl)
        else if(medicalChain.candidateNodeSet.indexOf(networkNodeUrl) == -1)medicalChain.candidateNodeSet.push(networkNodeUrl)
        counter++;
    })
    response.json({
        "note": "Candidate and Consensus node assigned correctly"
    })
})

app.post('/updateNodes', function(request, response) {
    const requestPromises = []
    medicalChain.consensusNodeSet.forEach(networkNodeUrl => {
        const requestOptions = {
            uri : networkNodeUrl + '/fetch-fitness-values',
            method : 'GET',
            body : {localhost : networkNodeUrl},
            json : true
        }
        requestPromises.push(rp(requestOptions))
    })
    Promise.all(requestPromises)
    .then(fitnessValuePairs => {
        let consensusNodePairs = {}
        fitnessValuePairs.forEach(fitnessValuePair => {
            consensusNodePairs[fitnessValuePair.localhost] = fitnessValuePair.fitnessValue
        })
        let candidateNodePairs = {}
        medicalChain.candidateNodeSet.forEach(candidateNodePair => {
            candidateNodePairs[candidateNodePair] = 100
        })
        //consensus Nodes obj converted into array
        consensusNodePairs = Object.keys(consensusNodePairs).map(key => {
            return [key, consensusNodePairs[key]]
        })
        //candidate Nodes obj converted into array
        candidateNodePairs = Object.keys(candidateNodePairs).map(key => {
            return [key, candidateNodePairs[key]]
        })

        // console.log(`consensus node pairs ${consensusNodePairs}`)
        // console.log(`candidate node pairs ${candidateNodePairs}`)

        consensusNodePairs.sort((first, second) => {
            return second[1] - first[1]
        })

        let length = consensusNodePairs.length
        let toBeReplaced = consensusNodePairs.splice(length-1)

        for(let i=0; i<1; ++i)  {
            consensusNodePairs.push(candidateNodePairs[i])
        }

        candidateNodePairs = candidateNodePairs.splice(1)
        candidateNodePairs.push(...toBeReplaced)
        // console.log(consensusNodePairs)
        // console.log(candidateNodePairs)  [(a,b), (c,d)]
        medicalChain.consensusNodeSet = []
        medicalChain.candidateNodeSet = []
        consensusNodePairs.forEach(pair => {
            medicalChain.consensusNodeSet.push(pair[0])
        })
        candidateNodePairs.forEach(pair => {
            medicalChain.candidateNodeSet.push(pair[0])
        })
        medicalChain.fitnessValue = 100
        const requestPromises = []
        medicalChain.networkNodes.forEach(networkNodeUrl => {
            const requestOptions = {
                uri : networkNodeUrl + '/update-fitness-values',
                method : 'POST',
                json : true
            }
            requestPromises.push(rp(requestOptions))
        })
        Promise.all(requestPromises)
        .then(data => {
            response.json({
                "note" : "fitness values updated"
            })
        })
        // response.json({
        //     "note" : "Endppoint tested"
        // })
    })
})

app.post('/update-fitness-values', function(request, response) {
    medicalChain.fitnessValue = 100
    response.json({
        "note" : "fitness value updated"
    })
})

app.get('/fetch-fitness-values', function(request, response) {
    const localhost = request.body.localhost
    const fitnessValue = medicalChain.fitnessValue
    response.json({
        "localhost" : localhost,
        "fitnessValue" : fitnessValue
    })
})

//request message
app.post('/request', function(request, response) {
    console.log(`Recieved request message from ${request.body.localhost}..........`)
    let requestPromises = []
    let decision
    medicalChain.consensusNodeSet.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/pre-prepare',
            method: 'GET',
            json: true
        }
        requestPromises.push(rp(requestOptions))
    })
    console.log(`Sending pre-prepared message to all consensus nodes.................`)
    Promise.all(requestPromises)
    .then(votes => {
        let count_of_votes = 1
        votes.forEach(vote => {
            if(vote == 'yes') count_of_votes++
        })
        if(count_of_votes >= 2) {
            console.log('Transactions are agreed by all')
            decision = 'yes'
        }
        else {
            console.log('Transactions are not agreed by all') 
            decision = 'no'
        }
        medicalChain.fitnessValue += 10     //fitness value of Master increases
        requestPromises = []
        medicalChain.consensusNodeSet.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/reply',
            body:{decision : decision},
            method: 'POST',
            json: true
        }
        requestPromises.push(rp(requestOptions))
      })
        Promise.all(requestPromises)
        .then(data => {
            if(decision == 'yes') {
                const lastBlock = medicalChain.getLastBlock();
                const previousBlockHash = lastBlock['blockHash'];
                const currentBlockData = {
                    transactions: medicalChain.pendingTransactions,
                    index: lastBlock['index'] + 1
                }
                const blockHash = medicalChain.hashBlock(previousBlockHash, currentBlockData)
                const newBlock = medicalChain.createNewBlock(previousBlockHash, blockHash)
    
                const requestPromises = [];
                medicalChain.networkNodes.forEach(networkNodeUrl => {
                    const requestOptions = {
                        uri: networkNodeUrl + '/recieve-new-block',
                        method: 'POST',
                        body: {newBlock: newBlock},
                        json: true
                    }
    
                    requestPromises.push(rp(requestOptions))
                })
    
                Promise.all(requestPromises)
                .then(data => {
                    response.json({
                        "note": "New Block mined and broadcast successfully"
                    })
                })
                .catch(err => {
                    console.log(`Error occured`)
                })
            }
        })  
    })
    .catch(err => {
        console.log(`error occured`)
    })

    //response.json({note: `Consensus achieved`})
})


//recieve and braodcast a new block
app.post('/recieve-new-block', function(request, response) {
    const newBlock = request.body.newBlock
    medicalChain.chain.push(newBlock)
    medicalChain.pendingTransactions = []
    response.json({
        "note": "new block successfully added to blockchain"
    })
})


// reply to all nodes and fitness value updation
app.post('/reply', function(request,response) {
    //console.log(`orkink`)
    const decision = request.body.decision
    if(medicalChain.vote == decision) {
        medicalChain.fitnessValue += 10
    } else {
        medicalChain.fitnessValue -= 5
    }
    //console.log(`fitnessValue ${medicalChain.fitnessValue}, decision: ${decision}, vote ${medicalChain.vote}`)
    response.json(`reply over`)
})


//pre-prepare message
app.get('/pre-prepare', async function(request, response) {
    console.log(`Recevied pre-prepared message from master node ${MASTER_NODE}.........`)
    let vote
    if(medicalChain.isValidTransactions()) console.log('Transactions are Valid!!\nEnter your choice(yes/no)')
    let promise = new Promise((resolve, reject) => {
        const r1 = readline.createInterface({
            input: process.stdin
        })
        r1.question('', vote => {
            resolve(vote)
            r1.close()
        })
    })
    vote = await promise
    medicalChain.vote = vote
    //console.log(`vote by me ${vote}`)
    console.log(`Sending reply to master node ${MASTER_NODE}..................`)
    response.send(vote)
})

//pbft algorithm phase 1
app.post('/consensus', function(request, response) {
    console.log('>>>>>>>>PROPOSER NODE<<<<<<<<<')
    const requestOption = {
        uri: MASTER_NODE + '/request',
        body:{localhost: request.body.localhost},
        method: 'POST',
        json: true
    }
    console.log(`Sending Request to Master node : ${MASTER_NODE}..........`)
    rp(requestOption)
    .then(data => {
        response.json(`Consensus achieved`)
    })

})

app.post('/transaction', function(request, response) {
    const newTransaction = request.body
    const blockIndex = medicalChain.addTransactionToPendingTransactions(newTransaction)
    response.json({note: `Your transaction will be added to ${blockIndex}`})
})

app.post('/transaction/broadcast', function(request, response) {
    const hash = sha256(request.body.amount.toString())
    const signature = node.signTransaction(hash)
    const fromAddress = node.publickey
    const newTransaction = medicalChain.createNewTransaction(request.body.amount, fromAddress, signature, hash)
    medicalChain.addTransactionToPendingTransactions(newTransaction)

    const requestPromises = [];
    medicalChain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        }

        requestPromises.push(rp(requestOptions))
    })

    Promise.all(requestPromises)
    .then(data => {
        response.json({note: `Transaction created and broadcasted successfully`})
    })
})

//register a node and broadcast the node it to the network
app.post('/register-and-broadcast-node', function(req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    if(medicalChain.networkNodes.indexOf(newNodeUrl) == -1) medicalChain.networkNodes.push(newNodeUrl);

    const regNodesPromises = [];
   medicalChain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/register-node',
            method: 'POST',
            body: {newNodeUrl: newNodeUrl },
            json: true 
        };

        regNodesPromises.push(rp(requestOptions));
    });

    Promise.all(regNodesPromises)
    .then(data => {
        const bulkRegisterOptions = {
            uri: newNodeUrl + '/register-nodes-bulk',
            method: 'POST',
            body: {allNetworkNodes: [...medicalChain.networkNodes,medicalChain.currentNodeUrl]},
            json: true
        };
        return rp(bulkRegisterOptions)
    })
    .then(data => {
        res.json({ note: 'New node registered with network successfully'});
    });
});

//register a node
app.post('/register-node', function(req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent = medicalChain.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = medicalChain.currentNodeUrl !== newNodeUrl;
    if(nodeNotAlreadyPresent && notCurrentNode)medicalChain.networkNodes.push(newNodeUrl);
    res.json({ note: 'New node registered successfully'});
});

//register multiple nodes at once
app.post('/register-nodes-bulk', function(req, res) {
    const allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.forEach(networkNodeUrl => {
        const nodeNotAlreadyPresent =medicalChain.networkNodes.indexOf(networkNodeUrl) == -1;
        const notCurrentNode =medicalChain.currentNodeUrl !== networkNodeUrl;
        if(nodeNotAlreadyPresent && notCurrentNode) medicalChain.networkNodes.push(networkNodeUrl);
    });

    res.json({ note: 'Bulk registration successful.'});
});

app.listen(port, function() {
    console.log(`Listening to ${port}`)
})
