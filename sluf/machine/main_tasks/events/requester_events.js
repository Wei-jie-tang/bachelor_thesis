const {
  ACK_EventHandler,
  create_sendtransaction,
  sendReq,
  sendGETLargeData,
} = require("./help_functions");
const mergingFiles = require("../../3rd_Process/merging");

function handling_requester_events(
  LocalActorConnection,
  Requesters_log,
  Requester_eventEmitter,
  transaction_creator,
  Rules_object,
  processFiles,
  Signature_Validator,
  metadatahash
) {
  //when a replie comes

  Requester_eventEmitter.on(
    "ACK_data",
    async ([recieved_data, transaction]) => {
      let json_recieved_data = JSON.parse(recieved_data);
      LocalActorConnection.localsocket.write(
        Requesters_log.length > 1
          ? json_recieved_data.Data.toString()
          : JSON.parse(transaction).Data.toString()
      );
      let transaction_hash = transaction_creator.transaction_hash(
        JSON.parse(transaction)
      );
      var corresponding_requester = Requesters_log.find(
        (requester) => requester.replier_name === json_recieved_data.Replier
      );
      var replier_signatureValidatorACK = new Signature_Validator(
        corresponding_requester.replier_publicKey
      );

      await ACK_EventHandler(
        recieved_data,
        Rules_object,
        processFiles.masterfile_under_modifications,
        replier_signatureValidatorACK,
        transaction_hash
      );
    }
  );
}

function handling_localactor_events(
  end_event,
  Requester_eventEmitter,
  transaction_creator,
  processFiles,
  Requesters_log,
  Rules_object,
  Signature_Validator
) {
  // when a data comes from the local actor

  setInterval(() => {
    if (
      end_event.applie_Rule(processFiles.masterfile_under_modifications) == true
    ) {
      // end event not reached yet
      end_event.starting_date_ms = Date.now();
      processFiles.create_masterfile_under_modifications(); // create a new file
    }
    end_event.applie_Rule(processFiles.masterfile_under_modifications);
  }, 100);

  Requester_eventEmitter.on("LocalActor_data", (data) => {
    //when the local actor sends data
    create_sendtransaction(
      processFiles.masterfile_under_modifications,
      Requester_eventEmitter,
      Requesters_log,
      transaction_creator,
      data,
      Rules_object,
      Signature_Validator
    );
    end_event.transaction_counter++;
  });
}

function handling_END_events(
  end_event,
  Requester_eventEmitter,
  processFiles,
  Second_Process,
  Requesters_log
) {
  // end event
  Requester_eventEmitter.on("END", (ended_masterFile) => {
    end_event.starting_date_ms = Date.now();
    end_event.transaction_counter = 0;
    processFiles.create_masterfile_under_modifications(); // create a new file
    console.log("**********EndProcess Began********** ", ended_masterFile.name);
    sendReq("", Requesters_log, "END", Requester_eventEmitter);
    setTimeout(() => {
      //to just recieve the last ack of the others
      processFiles.create_masterfile_after_END(); //the file is going to be in Ended folder
      Second_Process.rules_process(
        ended_masterFile,
        processFiles.masterfile_after_END
      );
    }, 5);
  });
}

function handling_FileHash_events(
  judge_eventEmitter,
  largeDataPort,
  processFiles,
  clientOFlargeData,
  Requester_eventEmitter,
  Requesters_log,
  SecondProcess
) {
  //events after the end event
  Requester_eventEmitter.on("FileHashCreated", (file_hash) => {
    var fileHash_message = JSON.stringify({ fileHashs: file_hash });
    sendReq(
      fileHash_message,
      Requesters_log,
      "Requester_Filehash",
      Requester_eventEmitter
    );
  });
  Requester_eventEmitter.on(
    "FilehashCollectISdone",
    (repliers_filehashes_array) => {
      let timer = setInterval(() => {
        if (SecondProcess.fileHash != undefined) {
          clearInterval(timer);
          //let allEqual = repliers_filehashes_array.every(item => item === SecondProcess.fileHash)
          let allEqual = false; //testing
          if (allEqual == true) {
            // copy the file to the closed folder
            SecondProcess.master_file.closeFiles(
              "./Files/Closed/masterFiles/",
              "./Files/Closed/fileHashes/",
              SecondProcess.fileHash,
              SecondProcess.metadataHash
            );
            console.log("********Normal process was successful ********");
          } else {
            // start internal Judge
            //processFiles.DataFile_array=[] //reinitialisation for the new process
            processFiles.create_mergedFile();
            sendGETLargeData(
              Requesters_log,
              "SendFileData",
              clientOFlargeData,
              processFiles.masterfile_after_END.name,
              largeDataPort
            );
          }
        }
      }, 100);
    }
  );

  Requester_eventEmitter.on("Got_fileData", (file_path) => {
    SecondProcess.collect_filedata(Requesters_log.length, file_path);
  });

  Requester_eventEmitter.on("FileDataCollectISdone", (filePaths_array) => {
    //start merging the files
    mergingFiles(
      processFiles.mergedFile,
      Requester_eventEmitter,
      filePaths_array,
      SecondProcess.master_file
    );
  });
  Requester_eventEmitter.on("mergingISdone", async (mergedFile) => {
    processFiles.create_auditor_summaryFiles();
    judge_eventEmitter.emit("START_JUDGE", mergedFile);
  });
}

module.exports = {
  handling_requester_events,
  handling_localactor_events,
  handling_END_events,
  handling_FileHash_events,
};
