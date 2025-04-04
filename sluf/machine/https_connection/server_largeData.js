
const https = require('https');
const fs = require('fs');
const express = require('express');
const app = express();
const zlib = require('zlib');

const options = {
    key: fs.readFileSync(`./https_connection/server_certificates/server-key.pem`),
    cert: fs.readFileSync(`./https_connection/server_certificates/server-crt.pem`)
};



class ServerOFlargeData{
    constructor(port,ip,eventEmitter){
        this.port=port
        this.ip=ip
        this.eventEmitter=eventEmitter
        this.createServer()
        this.events()
       
    }
    createServer(){
        https.createServer(options, app).listen(this.port,this.ip,() => {
            console.log(`Server for largeData is running at https://${this.ip}:${this.port}`);
          });

    }
    events(){
      app.get('/SendFileData',(req, res) => {
        this.eventEmitter.emit('SendingFileData',(res))})
      app.post('/StreamData',(req, res) => {
          this.postData(req)
        })
      }
     postData(req){
      let data = '';
      req.on('data', chunk => {
        data += chunk;
      });
  
      // When all data is received
      req.on('end', () => {
        console.log('Received data:', data.length, 'bytes');
        this.eventEmitter.emit('GotStreamData', (data))

      });
      req.on('error', err => {
        console.error('Error receiving data:', err);
      });
     } 
    sendBackdata(res, file){
        res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'gzip',
            'Content-Disposition': 'attachment; filename="output.txt.gz"',
          });
          // Create a readable stream from the file
          const readStream = fs.createReadStream(file.path);
          // Create a gzip transform stream
          const gzip = zlib.createGzip();
        
          // Pipe the read stream through gzip and then to the response
          readStream.pipe(gzip).pipe(res);
        
          // Handle errors
          readStream.on('error', (err) => {
            console.error('Error reading file:', err);
            //res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
          });
        
          res.on('close', () => {
            console.log('Response closed by client.');
          });
          
    }

}
module.exports= ServerOFlargeData