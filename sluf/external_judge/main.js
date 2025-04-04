const configurationFile= require('./configurationFile.json')
const fs = require('fs');
var events = require('events')
const rules = require('./Rules/Rules')
const ServerConnection= require('./Server_connection/https_server')
const external_Judge= require('./external_judge')
const File =require('./File_Management')
const {handling_events}= require('./handling_events')
const Judge = require('./judge')
const Signature_Validator= require('./signature_validator');
let metadata_hash=require('./metadata_creator'); // create metadatahsh

let Rules_object= new rules(configurationFile.streaming)
const  {create_machineIDS,create_public_key}= require('./help_functions')



let metadata_file = JSON.parse(fs.readFileSync('metadata.json', "utf8"));
let  metadataFile_log= Object.values(metadata_file)
metadataFile_log.shift()
let metadatahash=metadata_hash(Object.values(metadata_file))
let machineIDS = create_machineIDS(metadataFile_log)



let mainEventEmitter = new events.EventEmitter();
let externalJudge= new external_Judge(configurationFile,File,mainEventEmitter,machineIDS) // helps manage data comming form the machine 
let https_server= new ServerConnection(configurationFile.httpsServerIP,configurationFile.httpsServerPort, mainEventEmitter,configurationFile)
let judge_object =new Judge(metadatahash,Rules_object,mainEventEmitter,metadataFile_log,Signature_Validator,create_public_key,File,machineIDS)

handling_events(mainEventEmitter,judge_object) // handling main events
https_server.createServer() // start listening for connection


 
