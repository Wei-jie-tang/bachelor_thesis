const https = require('https');
const process = require("process");
const fs = require('fs');

const zlib = require('zlib');
const path = require('path');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // to resolve the Error: self-signed certificate

// connect to the external judge to send data 

class ExternalJudge{
    constructor(ip,port){
      this.ip =ip
      this.port =port
        

    }
        send_largeData(file,path){
          var options =this.create_options(path)
          this.post_request(options, file);
        } 
        post_request(options,file){ //as a requester it is sending its data and recieving replier's data 
          // Make an HTTPS request
          const req = https.request(options, (res) => {
          });
    
          req.on('error', (err) => {
            console.error('Request error:', err);
          });
          const gzip = zlib.createGzip();
          const readStream = fs.createReadStream(file.path);
         //const readStream = fs.createReadStream('zz.txt');

          readStream.pipe(gzip).pipe(req);
          
          readStream.on('error', (err) => {
              console.error('Error reading file:', err);
              req.end('Internal Server Error');
            });
          req.on('close', () => {
              console.log('Response closed by client.');
            });
          
        }
        create_options(path){
            var options = {
                hostname:this.ip,
                port:   this.port,
                path: '/'+path,
                method: 'POST',
                headers: {
                  'Content-Type': 'application/octet-stream',
                  'Content-Encoding': 'gzip',
                  'Content-Disposition': 'attachment; filename="output.txt.gz"',
                }
               };
               return options
        }   
    }


module.exports=ExternalJudge