const configFile = require('./ConfigFile3.json')
var events = require('events');
const fs = require('fs');
const File =require('./File_Management')
const moment = require('moment'); 
let {createRequestersLog,create_machineIDS}= require('./actorsLog.js')
let metadata_hash=require('./metadata_creator'); // create metadatahsh
let {create_public_key,create_private_key}= require('./keys/key_creator') //function file to create the private key form pem file and the public key from the jwk format

//--------------------------------- importing private keys ---------------------------------- 
pemFilePath1 = "keys/private1.pem";
//pemFilePath1 = "/home/brilliant/Documents/ultrafast-blockchain-layer-for-energy-systems-BoostingChannel/BoostingChannel/new development/test_resources/private2.pem"; //comment above if machine 2 is the sender              
pemFilePath2 = "keys/private2.pem";
//pemFilePath2 = "/home/brilliant/Documents/ultrafast-blockchain-layer-for-energy-systems-BoostingChannel/BoostingChannel/new development/test_resources/private1.pem";//comment above if machine 2 is the sender
//------------------- importing metadata file -------------//
let metadata_file = JSON.parse(fs.readFileSync('metadata.json', "utf8"));
let  metadataFile_log= Object.values(metadata_file)
metadataFile_log.shift()
let metadatahash=metadata_hash(Object.values(metadata_file))
let machineIDS = create_machineIDS(metadataFile_log)
//--------------------------------- global data that differ for each machine ---------------------------------- 


//thing that need to be changed 
//const privateKey= create_private_key(pemFilePath1)   // Requester   
const privateKey= create_private_key(pemFilePath2)   // Replier     
//thing that need to be changed 

//--------------------------------- importing files ---------------------------------- 
let Replier = require('./https_connection/https_replier.js') //replier server connection
let Requester = require('./https_connection/https_requester'); // requester server connection
let REQUESTER=require('./main_tasks/main_requester') //requester main function
let REPLIER=require('./main_tasks/main_replier') // replier main function
const ProcessFiles= require('./process_Files.js') // create the files needed for the process
let END_event= require('./2nd_Process/End_Event'); // process to be executed when the end event is emitted   
let createTransaction=require('./transaction_creator'); //create the requester transaction 
const rules = require('./Rules/Rules') // rules to be applies on the message and the files
const Signature_Validator= require('./signature_validator'); // validate the signature before appending the message to the file 
const create_Replie =require('./create_Replie'); // create replier ACK
const SecondProcess =require('./2nd_Process/second_process');
let ClientOFlargeData= require('./https_connection/client_largeData.js')
let ServerOFlargeData= require('./https_connection/server_largeData.js')
let ExternalJudge= require('./external_judge')
let Judge= require('./3rd_Process/judge'); // internal judge

var myDataActor= metadataFile_log.find(item => item.ID === configFile.myID)


var Replier_eventEmitter = new events.EventEmitter();
var Requester_eventEmitter = new events.EventEmitter();
let Rules_object= new rules(configFile.streaming)
if(metadataFile_log.length > 2 && configFile.streaming ==false){
    const ReplieServer= require('./Actor_Connection/Replie_Server.js')
    ReplieServer(myDataActor.IP,configFile.localRepliePort,Replier_eventEmitter )
}

var myPublic_key = create_public_key(myDataActor.PublicKey)
var https_replier =new Replier(myDataActor.Port,Replier_eventEmitter,myDataActor.IP,myPublic_key) // who is gonna recieve requests
var processFiles=new  ProcessFiles(File, configFile.myID) 
let end_event= new END_event(configFile.End_Event[configFile.EndRule_index],configFile,Requester_eventEmitter,Date.now(),0,moment().format().split('T')[0]) // create an instant of an end event 
let transaction_creator = new createTransaction(configFile.myID,privateKey,metadatahash,myPublic_key)
let Replie_creator =new create_Replie(privateKey,configFile.myID) 
let  Second_Process =new SecondProcess( Rules_object,machineIDS,Requester_eventEmitter,metadatahash)
let client_largeData=new ClientOFlargeData(Requester_eventEmitter) 
let server_largeData=new ServerOFlargeData(configFile.largeDataPort,myDataActor.IP,Replier_eventEmitter)
let judge_eventEmitter= new events.EventEmitter();
let judge_object =new Judge(metadatahash,machineIDS,Rules_object,judge_eventEmitter,configFile.myID,transaction_creator,metadataFile_log,Signature_Validator,create_public_key)


let external_judge= new ExternalJudge(configFile.externalJudgeIP,configFile.externalJudgePort)
let Requesters_log=createRequestersLog(metadataFile_log, configFile.myID,create_public_key,Requester)

processFiles.create_masterfile_under_modifications() // create file where all data as going to be stored before the end process
let LocalActor_Connection = (configFile.localActorType_index == 0) ? require('./Actor_Connection/localActorTypeServer/local_connection')  : require('./Actor_Connection/localActorTypeClient/local_connection');
let LocalActorConnection= new LocalActor_Connection(configFile.Actor_Connection[configFile.Connection_index],configFile,Requester_eventEmitter,myDataActor.IP,configFile.streaming)

REPLIER(configFile,judge_object,server_largeData,Second_Process,end_event,https_replier,Replier_eventEmitter,Replie_creator,Requesters_log,processFiles,Rules_object,Signature_Validator,metadatahash)

setTimeout(() => {
    REQUESTER(external_judge,judge_object,configFile.largeDataPort,client_largeData,Second_Process,Requester_eventEmitter,end_event,transaction_creator,processFiles,LocalActorConnection,Requesters_log,Rules_object,Signature_Validator,metadatahash)
}, 1000);