const {
  continueTOappend,
  Transaction_EventHandler,
  sendReplierToReplier,
} = require("./help_functions");

function handling_replier_events(
  configFile,
  https_replier,
  replier_eventEmitter,
  Replie_creator,
  Requesters_log,
  processFiles,
  Rules_object,
  Signature_Validator,
  metadata_hash
) {
  // event when a transaction data comes
  replier_eventEmitter.on("transaction_data", async ([data, res]) => {
    let transaction_result = Rules_object.message_rules(data);
    var requester_DataActor = Requesters_log.find(
      (item) => item.replier_name === data.Requester
    );
    let requester_signatureValidator_Transaction = new Signature_Validator(
      requester_DataActor.replier_publicKey
    );
    continueTOappend(
      transaction_result,
      JSON.stringify(data),
      requester_signatureValidator_Transaction.validateSignature(
        data,
        "Transaction",
        metadata_hash
      ),
      processFiles.masterfile_under_modifications,
      "Transaction: "
    );
    /*  if(Requesters_log.length >1 && configFile.streaming ==false){ // there is more than 2 nodes
            console.log('***************you may now enter your answer**************')
            replier_eventEmitter.once('localReplie',(localReplie)=>{
                let [Replie_created,transactionHash] =Replie_creator.Replie(data,localReplie,Requesters_log)
                let replier_signatureValidatorACK=new Signature_Validator(https_replier.myPublic_key)
                Transaction_EventHandler(Replie_created,transactionHash,res,Rules_object,replier_signatureValidatorACK,processFiles.masterfile_under_modifications)
                sendReplierToReplier(Replie_created, Requesters_log,'ReplierTOreplier_ACK',replier_eventEmitter,data.Requester) //send myReplie to the other repliers
            })
        }else {*/

    let [Replie_created, transactionHash] = Replie_creator.Replie(
      data,
      data.Data,
      Requesters_log
    );
    let replier_signatureValidatorACK = new Signature_Validator(
      https_replier.myPublic_key
    );
    Transaction_EventHandler(
      Replie_created,
      transactionHash,
      res,
      Rules_object,
      replier_signatureValidatorACK,
      processFiles.masterfile_under_modifications
    );
    sendReplierToReplier(
      Replie_created,
      Requesters_log,
      "ReplierTOreplier_ACK",
      replier_eventEmitter,
      data.Requester
    ); //send myReplie to the other repliers

    //  }
  });
}
function handling_replierTOreplier_events(
  Requesters_log,
  replier_eventEmitter,
  Rules_object,
  processFiles,
  Signature_Validator
) {
  //event when a message comes from another replier (Not the requester) ==> in case of 3 or more actors

  replier_eventEmitter.on("ReplierTOreplier_ACK", (ACK_ToReplier) => {
    let replie_result = Rules_object.message_rules(ACK_ToReplier); // eventual concictency for the ACK
    var corresponding_requester = Requesters_log.find(
      (requester) => requester.replier_name === ACK_ToReplier.Replier
    );
    var replier_signatureValidatorACK = new Signature_Validator(
      corresponding_requester.replier_publicKey
    );
    continueTOappend(
      replie_result,
      JSON.stringify(ACK_ToReplier),
      replier_signatureValidatorACK.validateSignature(
        ACK_ToReplier,
        "ACK Replier",
        ACK_ToReplier.TransactionHash
      ),
      processFiles.masterfile_under_modifications,
      "ACK: "
    );
  });
}
function handling_END_events(
  Replier_eventEmitter,
  processFiles,
  Second_Process,
  end_event
) {
  // end event
  Replier_eventEmitter.on("END", () => {
    end_event.starting_date_ms = Date.now(); //reinitialise the end event cause it has already been emitted
    end_event.transaction_counter = 0;
    console.log(
      "**********EndProcess Began**********",
      processFiles.masterfile_under_modifications.name
    );
    let ended_masterFile = processFiles.masterfile_under_modifications;
    processFiles.create_masterfile_after_END(); //the file is going to be in Ended folder
    processFiles.create_masterfile_under_modifications(); // create a new file
    Second_Process.rules_process(
      ended_masterFile,
      processFiles.masterfile_after_END
    );
  });
}
function handling_FileHash_events(
  processFiles,
  Server_largeData,
  Replier_eventEmitter,
  Requesters_log,
  SecondProcess
) {
  // after the end event
  Replier_eventEmitter.on("got_RequesterFileHash", (file_hash) => {
    var replier_filehash = file_hash.fileHash;
    SecondProcess.collect_filehashes(replier_filehash, Requesters_log.length);
  });

  Replier_eventEmitter.on("SendingFileData", (res) => {
    processFiles.create_mergedFile();
    Server_largeData.sendBackdata(res, SecondProcess.master_file);
  });
}

module.exports = {
  handling_replier_events,
  handling_replierTOreplier_events,
  handling_END_events,
  handling_FileHash_events,
};
