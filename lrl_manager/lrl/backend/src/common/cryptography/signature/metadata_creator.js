let crypto = require('crypto');
const fs = require('fs');


//---------------------------------TEST VALUES----------------------------------

let commonData = {  SmartContractBlock : "5",
                    SmartContactID : "Ab8483F64d9C6d1EcF9b849Ae677dD3315835cb2"};

let actorData1 = {  ID : "machine1",
                    Wallet : "5B38Da6a701c568545dCfcB03FcB875f56beddC4",
                    PublicKey: "/home/brilliant/Documents/ultrafast-blockchain-layer-for-energy-systems-BoostingChannel/BoostingChannel/new development/test_resources/public1.pem",
                    IP : "localhost",
                    Port : 12350
                }

let actorData2 = {  ID : "machine2",
                    Wallet : "5B38Da6a701c568545dCfcB03FcB875f56beddC5",
                    PublicKey : "/home/brilliant/Documents/ultrafast-blockchain-layer-for-energy-systems-BoostingChannel/BoostingChannel/new development/test_resources/public2.pem",
                    IP : "localhost",
                    Port : 12351
                }

let metadata = createMetadata(commonData,actorData1,actorData2);
console.log(metadata);
let metadataHash = crypto.createHash('sha256').update(metadata).digest('hex');
console.log(metadataHash);

//---------------------------------- TRANSACTION CREATOR ----------------------------------------------/

function createMetadata (common, actor1, actor2)
{
    let time = Date.now();
    let keydata = fs.readFileSync(actor1.PublicKey, "utf8");
    let publicKey1 = 0;
    let publicKey2 = 0;

    if (actor1.PublicKey.includes("pem"))
        publicKey1 = crypto.createPublicKey({key: keydata, format: "pem", type: "pkcs8"});
    else
        publicKey1 = crypto.createPublicKey({key: JSON.parse(keydata), format: "jwk"});

    keydata = fs.readFileSync(actor2.PublicKey, "utf8");

    if (actor2.PublicKey.includes("pem"))
        publicKey2 = crypto.createPublicKey({key: keydata, format: "pem", type: "pkcs8"});
    else
        publicKey2 = crypto.createPublicKey({key: JSON.parse(keydata), format: "jwk"});
    
     // Sign the message's hash (input must be an array, or a hex-string)
    let data1 = {ID: actor1.ID, Wallet: actor1.Wallet, PublicKey : publicKey1.export({format: "jwk"}),IP: actor1.IP, Port: actor1.Port}; 
    let data2 = {ID: actor2.ID, Wallet: actor2.Wallet, PublicKey : publicKey2.export({format: "jwk"}),IP: actor2.IP, Port: actor2.Port}; 

    let metadata = JSON.stringify({CommonData: common, DataActor1: data1, DataActor2: data2});

    return (metadata);
}