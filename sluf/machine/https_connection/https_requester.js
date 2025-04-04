const https = require("https");
const process = require("process");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // to resolve the Error: self-signed certificate
const fs = require("fs");
/**
 * @brief Requester
 *
 * This class creates a request object (client) that is goint to connect to the replier
 *
 * @param port: port to listen for connections
 *
 * @return server object
 */
t = new https.Agent({
  keepAlive: true,
  rejectUnauthorized: false,
});
class Requester {
  constructor(replierIP, replier_name, port, replier_publicKey, myPublic_key) {
    this.replierIP = replierIP;
    this.myPublic_key = myPublic_key;
    this.port = port;
    this.replier_name = replier_name;
    this.replier_publicKey = replier_publicKey;
  }
  send_requests(my_path, message, eventEmitter) {
    // send requests to the replier

    var options = this.create_options(my_path);
    var req = https.request(options, (res) => {
      let data = "";
      res.on("data", function (d) {
        data += d;
      });
      res.on("end", () => {
        this.do_function(data, message, my_path, eventEmitter);
      });
    });
    req.on("error", function (e) {
      console.log("https_replier is not there", options.port);
    });
    req.write(message);
    req.end();
  }
  do_function(recieved_data, message, my_path, eventEmitter) {
    //when data comes from the replier
    if (my_path == "transaction") {
      eventEmitter.emit("ACK_data", [recieved_data, message]);
    } else if (my_path == "END") {
      eventEmitter.emit("StartSecondProcess");
    } else if (my_path == "Requester_Filehash") {
      // eventEmitter.emit('got_ReplierFileHash', JSON.parse(recieved_data));
    } else if (my_path == "Replier_Filehash") {
      // eventEmitter.emit('got_ReplierFileHash', JSON.parse(recieved_data));
    } else if (my_path == "Requester_auditor_Filehash") {
      eventEmitter.emit("got_Replier_Filehash", JSON.parse(recieved_data));
    }
  }

  create_options(my_path) {
    var options = {
      hostname: this.replierIP,
      port: this.port,
      path: "/" + my_path,
      method: "POST",

      headers: {
        "Content-Type": "application/json", // permet the server to get the data directly as json object
      },
      timeout: 200,
    };
    return options;
  }
}

module.exports = Requester;
