const sha256 = require('sha256')
const EC = require('elliptic').ec
const ec = new EC('secp256k1')
const currentNodeUrl = process.argv[3];


function Blockchain() {
    this.chain = [];
    this.pendingTransactions = [];
    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];
    this.vote = null;
    this.fitnessValue = 100;
    this.consensusNodeSet = [];
    this.candidateNodeSet = [];
    this.createNewBlock('100', 0, '0');
}

Blockchain.prototype.createNewBlock = function(previousBlockHash, blockHash) {
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        transactions: this.pendingTransactions,
        blockHash: blockHash,
        previousBlockHash: previousBlockHash
    };

    this.pendingTransactions = [];
    this.chain.push(newBlock);
    return newBlock;
}

Blockchain.prototype.getLastBlock = function() {
    return this.chain[this.chain.length - 1];
}

Blockchain.prototype.createNewTransaction = function(amount, fromAddress, signature, hash) {
    const newTransaction = {
        amount: amount,
        fromAddress: fromAddress,
        signature: signature,
        hash: hash
    };
    return newTransaction;
    //this.pendingTransactions.push(newTransaction);
}

Blockchain.prototype.addTransactionToPendingTransactions = function(transactionObj) {
    this.pendingTransactions.push(transactionObj);
    return this.getLastBlock()['index'] + 1;
}

Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockData) {
    const dataAsString = previousBlockHash + JSON.stringify(currentBlockData);  
    return sha256(dataAsString);
}

Blockchain.prototype.isValidTransactions = function() {
    let valid = true;
    if(this.pendingTransactions.length == 0) return valid;
    this.pendingTransactions.forEach(transaction => {
        const signature = transaction.signature;
        const publicKey = transaction.fromAddress;
        const hash = transaction.hash;
        const keyObject = ec.keyFromPublic(publicKey, 'hex');
        if(!keyObject.verify(hash, signature)) valid = false;
    })
    return valid;
}

/*Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while(hash.substring(0, 4) !== '0000') {
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }
    return nonce;
}

Blockchain.prototype.chainIsValid = function(blockchain) {
    let validChain = true;
 
    for(var i=1; i<blockchain.length; ++i) {
        const currentBlock = blockchain[i];
        const previousBlock = blockchain[i-1];
        const blockHash = this.hashBlock(previousBlock['hash'], {transactions: currentBlock['transactions'], index: currentBlock['index']}, currentBlock['nonce']);
        if(blockHash.substring(0, 4) !== '0000') validChain = false;
        if(currentBlock['previousBlockHash'] !== previousBlock['hash']) validChain = false;
    }

    const genesisBlock = blockchain[0];
    const correctNonce = genesisBlock['nonce'] === 100;
    const correctPreviousBlockHash = genesisBlock['previousBlockHash'] === '0';
    const correctHash = genesisBlock['hash'] === '0';
    const correctTransactions = genesisBlock['transactions'].length === 0;
    
    if(!correctHash || !correctPreviousBlockHash || !correctHash || !correctTransactions || !correctNonce) validChain = false;
    return validChain;
}
*/

module.exports = Blockchain;