const net = require("net");
var http = require("http");

/**
 * @brief LocalActor_Connection
 *       this class connects this machine to the external local actor that is going to send the data
 *
 */

class LocalActor_Connection {
  constructor(connectionType, config_file, eventEmitter, myIP, streaming) {
    this.config_file = config_file;
    this.connectionType = connectionType;
    this.eventEmitter = eventEmitter;
    this.localsocket;
    this.myIP = myIP;
    this.streaming = streaming;
    this.applie_Connection();
  }
  applie_Connection() {
    if (this.connectionType == "TCP_Size") {
      this.TCP_connection(this.config_file.TCP_SizeBytes, "Size");
    } else if (this.connectionType == "TCP_Timer") {
      this.TCP_connection(this.config_file.TCP_Timer_InMS, "Timer");
    } else {
      this.http_connection();
    }
  }
  TCP_connection(rule, rule_type) {
    var data_buffer = "";
    let client = new net.Socket();
    this.localsocket = client;
    client.connect(5000, this.myIP); // connect to the external_server
    client.on("data", function (data) {
      data_buffer += data;

      client.emit("LocalActor_data", data.toString());
      /*if(rule_type== 'Size'){
>>>>>>> 970deb0 (Overwriting main branch with new folder)
                    if(data_buffer.length >= rule){
                        console.log('dataLength',data_buffer.length)
                         client.emit('LocalActor_data',data_buffer.slice(0,rule+1))
                        data_buffer= data_buffer.slice(rule+1)

                    }
                        // client.emit('LocalActor_data',data.toString()) //testing

            }
            else{ 
                setTimeout(() => {
                    client.emit('LocalActor_data',data_buffer)
                    data_buffer=''
                }, rule);


            }*/
    });
    client.on("LocalActor_data", (data) => {
      let event_title =
        this.streaming == false ? "LocalActor_data" : "Stream_Actor_data";
      this.eventEmitter.emit(event_title, data);
    });
    client.on("error", (e) => {
      console.log("there is an error in the local connection");
    });
    client.setTimeout(5000);
    client.on("timeout", () => {
      console.log("Connection timed out");
      client.emit("LocalActor_data", data_buffer);
      data_buffer = "";
    });
  }

  http_connection() {
    const options = {
      hostname: this.myIP,
      port: this.config_file.LocalActorPort,
      path: "/",
      method: "POST",
    };
    setInterval(() => {
      console.log("getting data from external actor");
      var req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          console.log("this is ", data);
          this.eventEmitter.emit("LocalActor_data", data);
        });
      });
      this.localsocket = req;
      req.write("");
      req.on("error", function (e) {
        console.error("http local actor SERVER is not there");
      });
    }, 500);
  }
}

module.exports = LocalActor_Connection;
