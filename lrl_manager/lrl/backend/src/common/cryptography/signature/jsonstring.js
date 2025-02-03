const fs = require('fs');
const crypto = require ('crypto');

let fileAddress = "/home/brilliant/Documents/ultrafast-blockchain-layer-for-energy-systems-BoostingChannel/BoostingChannel/new development/test_resources/metadata.json"
let metadata = JSON.parse(fs.readFileSync(fileAddress, "utf8"));
const publicKey = crypto.createPublicKey({key: metadata.DataActor1.PublicKey, format: 'jwk'});//for JWK
console.log(publicKey.export({format: "jwk"}));