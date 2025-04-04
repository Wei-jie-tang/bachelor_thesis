let crypto = require('crypto');

/**
 * @brief create_Replie
 *
 * This class creates a Replie object and append
 * 
 *
 * @param trans: the transaction coming from the server
 * @param replier_key: key needed to create the signature
 * 
 * @return replie
 */

class create_Replie{
    constructor( replier_key,replier_ID){
        this.replier_key=replier_key
        this.replier_ID=replier_ID
    }
    transaction_hash(trans ){ // create the transactionHash 
        let build_string =  trans.Requester+ trans.Timestamp+trans.Data 
        let transactionhash = crypto.createHash('sha256').update(build_string).digest('hex');
        return transactionhash
    }
    Replie(trans,data,Requesters_log){ // build the ACK
          let transactionhash = this.transaction_hash(trans)
           
           let replie 
           if(Requesters_log.length > 1){// more than two actors
            let signature = crypto.sign('sha256', ( this.replier_ID+ trans.Timestamp +data+ transactionhash), this.replier_key);
            replie= JSON.stringify({
                Requester:  trans.Requester,//the one that is gonna recieve this message
                Replier:  this.replier_ID, //the one that is gonna send this message
                Timestamp: trans.Timestamp,
                Data : data ,
                TransactionHash : transactionhash, // for the case of 3 or more actors
                Signature: signature.toString('base64')}
                );

           }else{ // for the case of 2
            let signature = crypto.sign('sha256', ( this.replier_ID+ trans.Timestamp + transactionhash), this.replier_key);
            replie = JSON.stringify({
                Requester:  trans.Requester,//the one that is gonna recieve this message
                Replier:  this.replier_ID, //the one that is gonna send this message
                Timestamp: trans.Timestamp,
                //TransactionHash : transactionhash, 
                Signature: signature.toString('base64')}
                );
           }
                
                return [replie,transactionhash]

    }

    
}

module.exports = create_Replie