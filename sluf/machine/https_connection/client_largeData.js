const express = require('express');
const https = require('https');
const fs = require('fs');
var events = require('events');
const app = express();
const { Readable } = require('stream');
const process = require("process");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // to resolve the Error: self-signed certificate

const zlib = require('zlib');


class ClientOFlargeData{
    constructor(eventEmitter){
        this.eventEmitter=eventEmitter
    }
    
    send_getlargeData(ip,port,path,file_name){// sending get request to the others to get their data
      var options =this.create_fileoptions(path,ip,port,'GET')
      this.get_request(options,file_name);
    }
    get_request(options,file_name){
      // Make an HTTPS request
      const req = https.request(options, (res) => {
        // Check for gzip encoding
        const encoding = res.headers['content-encoding'];
          const file_path= './Files/Auditor_Files/beforeMerging/'+file_name

        if (encoding === 'gzip') {
          console.log('Response is gzip encoded.');
      
          // Create a writable stream to save the file
          const fileStream = fs.createWriteStream(file_path+'.txt.gz');
      
          // Pipe the response stream to the writable stream
          res.pipe(fileStream);
      
          fileStream.on('finish', () => {
            console.log('File received and saved in a zip form.'); 
             this.eventEmitter.emit('Got_fileData',(file_path))
            // Decompress the file after receiving
           /* fs.createReadStream(file_path+'.txt.gz')
              .pipe(zlib.createGunzip())
              .pipe(fs.createWriteStream(file_path+'.txt'))
              .on('finish', () => {
                console.log('File decompressed.', file_path);
              });*/
          });
      
          fileStream.on('error', (err) => {
            console.error('Error writing to file:', err);
          });
      
        } else {
          console.log('Unexpected encoding:', encoding);
        }
        res.on('end', () => {
          console.log('No more data in response client large data get req',file_name);
        
        });
      });

      req.on('error', (err) => {
        console.error('Request error:', err);
      });
      
      // End the request
      req.end();
      
      

    }
    send_postlargeData(ip,port,path,data){// sending get request to the others to get their data
      var options =this.create_dataoptions(path,ip,port,'POST',data)
      this.post_request(options,data);
    }
    post_request(options,data){
      const req = https.request(options, res => {
       /* let responseData = '';
      
        res.on('data', chunk => {
          responseData += chunk;
        });
      
        res.on('end', () => {
          console.log('Server response:', responseData);
        });*/
      });
      
      // Handle request errors
      req.on('error', err => {
        console.error('Request error:', err);
      });
      
      // Send the large string
      req.write(data);
      req.end();
      

    }

    create_fileoptions(path,ip,port,request_type){
        var options = {
            hostname:ip,
            port:   port,
            path: '/'+path,
            method: request_type,
            headers: {
              'Content-Type': 'application/octet-stream',
              'Content-Encoding': 'gzip',
              'Content-Disposition': 'attachment; filename="output.txt.gz"',
            }
           };
           return options
    }
    create_dataoptions(path,ip,port,request_type,data){
        var options = {
            hostname:ip,
            port:   port,
            path: '/'+path,
            method: request_type,
            headers: {
              'Content-Type': 'text/plain',
              'Content-Length': Buffer.byteLength(data)
            }
           };
           return options
    }

}

module.exports= ClientOFlargeData