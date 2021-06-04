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

//request message
app.post('/request', function(request, response) {
    console.log(`Recieved request message from ${request.body.localhost}..........`)
    let requestPromises = []
    let decision
    medicalChain.networkNodes.forEach(networkNodeUrl => {
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
        medicalChain.networkNodes.forEach(networkNodeUrl => {
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
    if(medicalChain.isValidTransactions()) console.log('Testing................')
    let promise = new Promise((resolve, reject) => {
        // randomly generating 0 or 1
        let binary = Math.floor((Math.random()*10)%2)
        if(binary == 1) resolve("yes")
        else resolve("no")
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
