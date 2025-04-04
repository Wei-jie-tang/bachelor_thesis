const https = require("https");
const fs = require("fs");
const express = require("express");

//-------------------------- Instantiate an Express application ----------------------------------
const app = express();
app.use(express.json());
/**
 * @brief Replier
 *
 * This class creates a server object that is going to get the requests
 *
 *
 * @return server object
 */


class Replier{
    constructor(port,Replier_eventEmitter,myIP,myPublicKey){
        this.port=port
        this.ip=myIP
        this.eventsEmitter=Replier_eventEmitter
        this.create_server()
        this.get_requests()
        this.myPublic_key= myPublicKey

     }
    
    
    get_requests(){ // what to do in case of every request
        app.post('/transaction', (req,res)=>{
            this.eventsEmitter.emit('transaction_data',[req.body,res]); 
        })
        app.post('/ReplierTOreplier_ACK',(req, res)=>{
            this.eventsEmitter.emit('ReplierTOreplier_ACK',req.body);            
        })
        app.post('/END', (req,res)=>{
            this.eventsEmitter.emit('END'); 
         })
         app.post('/Requester_Filehash', (req,res)=>{
            this.eventsEmitter.emit('got_RequesterFileHash',req.body); 
         })
         app.post('/Replier_Filehash', (req,res)=>{
            this.eventsEmitter.emit('got_ReplierFileHash',req.body); 
         })
         app.post('/CloseFile', (req,res)=>{
            this.eventsEmitter.emit('CloseFile'); 
         })
        /* app.post('/StartAuditor_sendFile', (req,res)=>{
            eventsEmitter.emit('StartAuditor_requesterFile',(res)); 
         })*/
        /* app.post('/ReplierTOreplier_Filedata', (req,res)=>{
            eventsEmitter.emit('StartAuditor_ReplierTOreplier_Filedata',(req.body)); 
         })*/
         app.post('/auditor_Filehash', (req,res)=>{
            this.eventsEmitter.emit('auditor_Filehash',(req.body)); 
         })
         app.post('/Start_external_Auditor', (req,res)=>{
            this.eventsEmitter.emit('Start_external_Auditor',([req.body,res])); 
         })

    }
    create_server(){
        https.createServer({
            key: fs.readFileSync(`./https_connection/server_certificates/server-key.pem`),
            cert: fs.readFileSync(`./https_connection/server_certificates/server-crt.pem`),
            ciphers: 'AES256+RSA', // Use AES for symmetric encryption with RSA for key exchange
            honorCipherOrder: true, // Use the cipher order specified
        },app).listen(this.port,this.ip ,()=>{console.log('server is runing ' + this.ip + ':' + this.port)
        });
    }

   

}    

module.exports= Replier