let crypto = require('crypto');
const fs = require('fs');


//---------------------------------PRIVATE KEY REGISTRATION----------------------------------

let msg = "test";

// Read the .pem file
let pemFilePath1 = "/home/brilliant/Documents/ultrafast-blockchain-layer-for-energy-systems-BoostingChannel/BoostingChannel/new development/test_resources/private2.pem";

let pemData = fs.readFileSync(pemFilePath1, "utf8");

// Parse the PEM or JWK data and extract the private key
const privateKey = crypto.createPrivateKey({key: pemData, format: "pem", type: "pkcs8"});//for PEM
//const privateKey = crypto.createPrivateKey({key: JSON.parse(pemData), format: "jwk"});//for JWK

//---------------------------------PRIVATE KEY SIGNATURE GENERATION (SHA256-ECDSA)----------------------------------

// Sign the message's hash (input must be an array, or a hex-string)

let signature = crypto.sign('sha256', Buffer.from(msg), privateKey);
//let signature = crypto.sign(null, Buffer.from(msg), privateKey);
console.log(signature.toString('base64'));


//---------------------------------PUBLIC KEY REGISTRATION----------------------------------

let pemFilePath2 = "/home/brilliant/Documents/ultrafast-blockchain-layer-for-energy-systems-BoostingChannel/BoostingChannel/new development/test_resources/public2.pem";

pemData = fs.readFileSync(pemFilePath2, "utf-8");

const publicKey = crypto.createPublicKey({key: pemData, format: "pem", type: "pkcs8"});//for PEM
//const publicKey = crypto.createPublicKey({key: JSON.parse(pemData), format: 'jwk'});//for JWK

//---------------------------------CHECK BASE64 SIGNATURE WITH PUBLIC KEY----------------------------------

//let str = "MEUCIQDsY5TkqzpkqmBAEFJFb1aj0bedYTAS5RtdK/y+kAkMtQIgM/5AAL9Hlbf+b/npWbAXDidSmXcq6WW8G7FrFL/NWF4="; //base64 signature to be verified
let str = signature.toString('base64');

let signature2=Buffer.from(str,'base64');//convert signature into "buffer" format

const verified = crypto.verify('sha256', Buffer.from(msg), publicKey, signature2); //verify the signature for ecDSA; msg should be a string.
//const verified = crypto.verify(null, Buffer.from(msg), publicKey, signature2); //verify the signature for ed25519

console.log('Match:', verified);