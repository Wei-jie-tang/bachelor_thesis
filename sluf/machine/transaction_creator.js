let crypto = require("crypto");

class createTransaction {
  constructor(senderID, sender_privatekey, metadataHash, sender_publickey) {
    this.senderID = senderID;
    this.senderkey = sender_privatekey;
    this.sender_publickey = sender_publickey;
    this.metadataHash = metadataHash;
  }

  async transaction(time, data) {
    // create the transaction

    // let time = (process.hrtime()[0] * 1e3) + (process.hrtime()[1] / 1e6) // current timestamp to avoid having the same timestamp
    let signature = crypto.sign(
      "sha256",
      this.senderID + time.toString() + data + this.metadataHash,
      this.senderkey
    );

    let transaction = JSON.stringify({
      Requester: this.senderID,
      Timestamp: time.toString(),
      Data: data,
      Signature: signature.toString("base64"),
    });

    return transaction;
  }
  transaction_hash(transaction) {
    // create the transactionHash
    let build_string =
      transaction.Requester + transaction.Timestamp + transaction.Data;
    let transactionhash = crypto
      .createHash("sha256")
      .update(build_string)
      .digest("hex");
    return transactionhash;
  }
}
module.exports = createTransaction;
