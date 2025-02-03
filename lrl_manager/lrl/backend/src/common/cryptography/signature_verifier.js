const fs = require('fs');
const crypto = require ('crypto');
const path = require('path');

//---------------------------------VALIDATE SIGNATURE----------------------------------------
exports.validateSignature = function (msg,signature,pubKey)
{
  let signatureBuffer=Buffer.from(signature,'base64');//convert signature into "buffer" format

  const verified = crypto.verify('sha256', Buffer.from(msg), pubKey, signatureBuffer);

  return(verified);
}
