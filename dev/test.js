// const EC = require('elliptic').ec
// const sha256 = require('sha256')
// const ec = new EC('secp256k1')
// const blockchain = require('./blockchain')

// const key1 = ec.genKeyPair()  
// const key2 = ec.genKeyPair()
// const key3 = ec.genKeyPair()

// //console.log(key1.getPrivate('hex') + "\n" + key2.getPrivate('hex') + "\n" + key3.getPrivate('hex'))

// const publicKey = key1.getPublic('hex');
// //const privateKey = key1.getPrivate('hex');
// const hash = sha256('siva')

// //console.log("privateKey: " + privateKey + "\npublicKey: " + publicKey)

// var signature = key1.sign(hash, 'base64')
// signature = signature.toDER('hex')
// //console.log(signature)

// const keyObject = ec.keyFromPublic(publicKey, 'hex')
// console.log(keyObject.verify(hash, signature))


// // const bitcoin = new blockchain()
// // bitcoin.addTransactionToPendingTransactions( {amount:200,
// //     fromAddress:	"045768909e6793c32b69194dff44d7e6eddfce6e691ac87b74193aed4b8d5f836cb47413e2b24293867b5c4533255cff6112458f9330d5bdf7a4bdb8dad5ee54ed",
// //     signature:	"304402204e80eecf9c7a5593bd2bdc60a18759ce17a5d50e4e4d5f50aee2070cab2c1cfc02204fea98cbcc40fd87d275a376edeb90642acbd0f2e8e6465cd2ba7f4793c6570f",
// //     hash:	"27badc983df1780b60c2b3fa9d3a19a00e46aac798451f0febdca52920faaddf"})

// // console.log(bitcoin.isValidTransactions())


// // const prompt = require('prompt-sync')()

// // const name = prompt('Enter your name')

// // console.log(`Your name is ${name}`)

   
//   readline.question('Who are you?\n', name => {
//     console.log(`Hey there ${name}!`);
//     readline.close();
//   });


// const readline = require('readline')

// async function f() {
//     let promise = new Promise((resolve, reject) => {
//         const r1 = readline.createInterface({
//             input: process.stdin,
//             output: process.stdout
//         })

//         r1.question(`Enter your vote\n`, vote => {
//             r1.close()
//             resolve(vote)
//         })
//     })

//     let result = await promise;
//     console.log('hari')
// }

// f()
var faultyNodes = 2

let consensusNodeSet = {
    "http://localhost:3000" : 100,
    "http://localhost:3002" : 120,
    "http://localhost:3003" : 95,
    "http://localhost:3004" : 115
}

let candidateNodeSet = {
    "http://localhost:3005" : 100,
    "http://localhost:3006" : 100,
    "http://localhost:3007" : 100
}
// let consensusNodeSet = [
//     {
//         localhost : "http://localhost:3000",
//         fitnessValue : 100

//     },
//     {
//         localhost : "http://localhost:3003",
//         fitnessValue : 100

//     },
//     {
//         localhost : "http://localhost:3002",
//         fitnessValue : 100

//     }
// ]
// const pairs = {}
// consensusNodeSet.forEach(pair => {
//     pairs[pair.localhost] = pair.fitnessValue
// })
//console.log(pairs)
// let items = Object.keys(consensusNodeSet).map(key => {
//     return [key, consensusNodeSet[key]]
// })

// let items1 = Object.keys(candidateNodeSet).map(key => {
//     return [key, candidateNodeSet[key]]
// })

// //function overloading
// items.sort((first,second) => {
//     return second[1]-first[1]
// })

// // console.log(`After Sorting`)
// // console.log(items)

// let length = items.length

// let toBeReplaced = items.splice(length-faultyNodes)

// for(let i=0; i<faultyNodes; ++i) {
//     items.push(items1[i])
// }
// items1 = items1.splice(2) 
// //console.log(items1)
// items1.push(...toBeReplaced)

// console.log(items)
// console.log(items1)

// var arrays = [1,2,3]

// let left = arrays.slice(0,arrays.length/2+1)
// let right = arrays.slice(arrays.length/2+1)

// //console.log(Math.floor(arrays.length/2))
// console.log(`left ${left}`)
// console.log(`right ${right}`)
// console.log(`array ${arrays}`)

// let maps = {
//     'a' : 1,
//     'b' : 2,
//     'c' : 3
// }

// maps = Object.keys(maps).map(key => {
//     return [key, maps[key]]
// })

// maps.forEach(map => {
//     console.log(map[0])
// })

//console.log(Math.floor((Math.random()*1)+1))

console.log(Math.floor((Math.random()*10)%2))