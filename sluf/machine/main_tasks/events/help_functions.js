function sendReplierToReplier(
  message,
  Requesters_log,
  path,
  eventEmitter,
  requesterID
) {
  // sending the Replie to every actor other than the Requester
  Requesters_log.forEach((requester) => {
    if (requester.replier_name != requesterID) {
      console.log("sending to ", requester.replier_name);
      requester.send_requests(path, message, eventEmitter);
    }
  });
}

function sendReq(message, Requesters_log, path, eventEmitter) {
  // send requests
  Requesters_log.forEach((requester) => {
    requester.send_requests(path, message, eventEmitter);
  });
}
function sendGETLargeData(
  Requesters_log,
  path,
  clientOFlargeData,
  file_name,
  largeDataPort
) {
  // sernd requests
  Requesters_log.forEach((requester) => {
    clientOFlargeData.send_getlargeData(
      requester.replierIP,
      largeDataPort,
      path,
      file_name + requester.replier_name
    );
  });
}

function continueTOappend(bool_result, msg, true_function, file, name) {
  // function that append to the file in case of all rules are fulfilled

  if (bool_result == true) {
    var true_function_result = true_function;
    //file.append_to_file(title, msg,true_function_result) //if the result is true append the transaction to the file
    file.append_to_file(msg, true_function_result, name);
  }
}

var Transaction_EventHandler = function (
  Replie_created,
  transactionhash,
  res,
  Rules_object,
  signature_validator_ACK,
  file
) {
  //function that  continue working on the requester transaction
  res.send(Replie_created);
  let replie_result = Rules_object.message_rules(JSON.parse(Replie_created)); // eventual concictency for the ACK
  continueTOappend(
    replie_result,
    Replie_created,
    signature_validator_ACK.validateSignature(
      JSON.parse(Replie_created),
      "ACK",
      transactionhash
    ),
    file,
    "ACK: "
  );
};

var ACK_EventHandler = function (
  data,
  Rules_object,
  file,
  signature_validator_ACK,
  transaction_hash
) {
  //function that continue working on the replier ACK

  let replie_result = Rules_object.message_rules(JSON.parse(data)); // eventual concictency for the ACK
  continueTOappend(
    replie_result,
    data,
    signature_validator_ACK.validateSignature(
      JSON.parse(data),
      "ACK",
      transaction_hash
    ),
    file,
    "ACK: "
  );
};
async function create_sendtransaction(
  file,
  Requester_eventEmitter,
  Requesters_log,
  transaction_creator,
  data
) {
  //function that create the transaction out of the local data actor, send it too the replier

  var time = Date.now();
  let transaction = await transaction_creator.transaction(time, data);
  Requesters_log.forEach(async (requester) => {
    await requester.send_requests(
      "transaction",
      transaction,
      Requester_eventEmitter
    );
    file.append_to_file(transaction, true, "Transaction: ");
  });
}

module.exports = {
  sendReq,
  continueTOappend,
  Transaction_EventHandler,
  ACK_EventHandler,
  create_sendtransaction,
  sendGETLargeData,
  sendReplierToReplier,
};
