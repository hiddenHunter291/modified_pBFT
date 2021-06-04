const EC = require('elliptic').ec
const ec = new EC('secp256k1')

function Node() {
    this.KeyObject = ec.genKeyPair();
    this.publickey = this.KeyObject.getPublic('hex');
    this.privateKey = this.KeyObject.getPrivate('hex');
}

Node.prototype.signTransaction = function(hash) {
    const signature = this.KeyObject.sign(hash, 'base64');
    return signature.toDER('hex');
}

module.exports = Node;