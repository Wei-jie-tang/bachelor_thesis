const https = require('https');
const fs = require('fs');
const express = require('express');
const app = express();
const zlib = require('zlib');
const {delete_file}= require('../decompress')


class ServerConnection{
  constructor(ip,port,eventEmitter,configFile){
    this.ip =ip
    this.port = port
    this.eventEmitter = eventEmitter
    this.configFile=configFile
    this.Requests()
  }
  createServer(){
    const options = {
      key: fs.readFileSync('./Server_connection/server.key'),
      cert: fs.readFileSync('./Server_connection/server.cert')
    };
    https.createServer(options, app).listen(this.port,this.ip,() => {
      console.log(`Server for largeData is running at https://${this.ip}:${this.port}`);
    });
    
  }
  Requests(){
    
    app.post('/',(req, res) => {
      
      const encoding = req.headers['content-encoding'];
          const file_path= './Files/under_modifications/machinesFiles/file'+Date.now() + '.txt'

        if (encoding === 'gzip') {
          console.log('Response is gzip encoded.');
      
          // Create a writable stream to save the file
          const fileStream = fs.createWriteStream(file_path+'.gz');
      
          // Pipe the response stream to the writable stream
          req.pipe(fileStream);
      
          fileStream.on('finish', () => {
            console.log('File received and saved in a zip form.');
            this.eventEmitter.emit('machine_data',file_path)
            // Decompress the file after receiving
           /* fs.createReadStream(file_path+'.gz')
              .pipe(zlib.createGunzip())
              .pipe(fs.createWriteStream(file_path))
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
        req.on('end', () => {
          console.log('No more data in response client large data get req');
         // this.eventEmitter.emit('Got_repliersTOreplierData',(file_path))
        });
  })
  app.post('/summary',(req, res) => {
      
    const encoding = req.headers['content-encoding'];
        const file_path= './Files/under_modifications/machinesFiles/summaryfile'+Date.now()+'.txt'

      if (encoding === 'gzip') {
        console.log('Response is gzip encoded.');
    
        // Create a writable stream to save the file
        const fileStream = fs.createWriteStream(file_path+'.gz');
    
        // Pipe the response stream to the writable stream
        req.pipe(fileStream);
    
        fileStream.on('finish', () => {
          console.log('File received and saved in a zip form.');
         
          // Decompress the file after receiving
          fs.createReadStream(file_path+'.gz')
            .pipe(zlib.createGunzip())
            .pipe(fs.createWriteStream(file_path))
            .on('finish', () => {
              console.log('File decompressed.', file_path);
              this.eventEmitter.emit('summary_data',file_path)
              delete_file(file_path+'.gz')
              
            });
        });
    
        fileStream.on('error', (err) => {
          console.error('Error writing to file:', err);
        });
    
      } else {
        console.log('Unexpected encoding:', encoding);
      }
      req.on('end', () => {
        console.log('No more summary in response client large summary get req');
       // this.eventEmitter.emit('Got_repliersTOreplierData',(file_path))
      });
})
  }
}
module.exports= ServerConnection