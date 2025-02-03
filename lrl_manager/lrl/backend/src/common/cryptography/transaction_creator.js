let crypto = require('crypto');
const fs = require('fs');
const path = require('path');

//---------------------------------- TRANSACTION CREATOR ----------------------------------------------/

exports.createTransaction = function (senderkey)
{
    let time = Date.now();
    let keydata = fs.readFileSync(senderkey, "utf8");
    let privateKey1 = 0;

    if (senderkey.includes("pem"))
        privateKey1 = crypto.createPrivateKey({key: keydata, format: "pem", type: "pkcs8"});
    else
        privateKey1 = crypto.createPrivateKey({key: JSON.parse(keydata), format: "jwk"});

     // Sign the message's hash (input must be an array, or a hex-string)
    let signature = crypto.sign('sha256', (time.toString()), privateKey1);
    
    let transaction = JSON.stringify({ Timestamp: time.toString(), Signature: signature.toString('base64') });

    return (transaction);
}