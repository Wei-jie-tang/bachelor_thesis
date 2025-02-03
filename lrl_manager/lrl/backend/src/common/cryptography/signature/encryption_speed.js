let crypto = require('crypto');
const fs = require('fs');

//---------------------------------PRIVATE KEY REGISTRATION----------------------------------

let msg = "test";

// Read the .pem file
let pemFilePath1 = "/home/brilliant/Documents/ultrafast-blockchain-layer-for-energy-systems-BoostingChannel/BoostingChannel/new development/test_resources/private2.pem";

let pemData = fs.readFileSync(pemFilePath1, "utf8");

// Parse the PEM data and extract the private key
const privateKey = crypto.createPrivateKey({key: pemData, format: "pem", type: "pkcs8"});
//const privateKey = crypto.createPrivateKey({key: JSON.parse(pemData), format: "jwk"});

//---------------------------------PRIVATE KEY SIGNATURE GENERATION (SHA256-ECDSA)----------------------------------

let msgHash = crypto.createHash('sha256').update(msg).digest('hex');

// Sign the message's hash (input must be an array, or a hex-string)
let signature = crypto.sign(null, Buffer.from(msgHash,'hex'), privateKey);

//console.log(signature.toString('base64'));


//---------------------------------PUBLIC KEY REGISTRATION----------------------------------

let pemFilePath2 = "/home/brilliant/Documents/ultrafast-blockchain-layer-for-energy-systems-BoostingChannel/BoostingChannel/new development/test_resources/public2.pem";

pemData = fs.readFileSync(pemFilePath2, "utf-8");

const publicKey = crypto.createPublicKey({key: pemData, format: "pem", type: "pkcs8"});
//const publicKey = crypto.createPublicKey({key: JSON.parse(pemData), format: 'jwk'});

//---------------------------------CHECK BASE64 SIGNATURE WITH PUBLIC KEY----------------------------------

let str = "MEQCIGJmHKWqta4cy4/0yp2LBvIZR2KKuWKYkwkb7W7Rl2DVAiBOUML1EGZFribIvC9eZMq8SFDDNObW9U/ouhqdb7NWTw=="; //base64 signature

let signature2=Buffer.from(str,'base64');

//console.log(signature2.toString('base64'));

const verified = crypto.verify(null, Buffer.from(msgHash,'hex'), publicKey, signature2);

console.log('Match:', verified);

const metadata= "9483d1d246df989a3517b5945a7b9ce3bc9593cc392bed312258a5c8ae8a478d";
pemFilePath1 = "/home/brilliant/Documents/ultrafast-blockchain-layer-for-energy-systems-BoostingChannel/BoostingChannel/new development/test_resources/private2.pem";
pemFilePath2 = "/home/brilliant/Documents/ultrafast-blockchain-layer-for-energy-systems-BoostingChannel/BoostingChannel/new development/test_resources/private1.pem";

console.log(createTransaction(msg,metadata,"machine1",pemFilePath1,pemFilePath2));

//---------------------------------- TRANSACTION CREATOR ----------------------------------------------/

function createTransaction (data,metadataHash,senderID,senderkey,receiverkey)
{
    let time = Date.now();
    let keydata = fs.readFileSync(senderkey, "utf8");
    let privateKey1 = 0;
    let privateKey2 = 0;

    if (senderkey.includes("pem"))
        privateKey1 = crypto.createPrivateKey({key: keydata, format: "pem", type: "pkcs8"});
    else
        privateKey1 = crypto.createPrivateKey({key: JSON.parse(keydata), format: "jwk"});

    keydata = fs.readFileSync(receiverkey, "utf8");

    if (receiverkey.includes("pem"))
        privateKey2 = crypto.createPrivateKey({key: keydata, format: "pem", type: "pkcs8"});
    else
        privateKey2 = crypto.createPrivateKey({key: JSON.parse(keydata), format: "jwk"});
    
    // let val1 = BigInt(0);//
    // let val2 = BigInt(0);//
    // let val3 = BigInt(0);//
    // let val4 = BigInt(0);//
    // let aux = BigInt(0);//
    // for (let i=0; i<10000; i++){//
    // aux = process.hrtime.bigint();//
    let contentHash = crypto.createHash('sha256').update(time.toString()+data+metadataHash).digest('hex');

    // Sign the message's hash (input must be an array, or a hex-string)
    let signature = crypto.sign(null, Buffer.from(contentHash,'hex'), privateKey1);
    // aux = process.hrtime.bigint() - aux;//
    // val1 = val1 + aux;//
    // val3 = val3+aux*aux;//
    // }//
    // val1 = val1/BigInt(10000);//
    // val3 = val3/BigInt(10000-1)
    // for (let i=0; i<10000; i++){//
    //     aux = process.hrtime.bigint();//
    //     contentHash = crypto.createHash('sha256').update(time.toString()+data+metadataHash).digest('hex');//
        let ack = crypto.sign(null, Buffer.from(contentHash,'hex'), privateKey2);
    //     aux = process.hrtime.bigint() - aux;
    //     val2 = val2 + aux;//
    //     val3 = val3 + aux*aux;
    // }//
    // val2 = val2/BigInt(10000);//
    // val4 = val4/BigInt(10000-1);//
    let transaction = JSON.stringify({Sender: senderID, Timestamp: time, Data: data, Signature: signature.toString('base64'), Acknowledgement: ack.toString('base64')});//<--
    //console.log(val1,val2,val3,val4);//
    return (transaction);//<--
}

//---------------------------------- METADATA CREATOR ----------------------------------------------/
