var events = require('events');
var crypto = require('crypto');const path = require('path');
const os = require('os');
var Sorting= require('./largeData/sortChunks')
var applyRulesONchunks = require('./largeData/applieRules')
var sortDeleteMergeChunks= require('./largeData/mergeChunks')
let hashingFile =require('./largeData/Hash')
let cleanUpTempFiles=require('./largeData/clean')


class judge{
    constructor(metadatahash,Rules_object,mainEventEmitter,metadataFile_log,Signature_Validator,create_public_key,File_class,machineIDS){
        this.machineIDS=machineIDS
        this.mainEventEmitter=mainEventEmitter
        this.MetadataHash=metadatahash
        this.Judge_evenEmitter= new events.EventEmitter()  
        this.events()
        this.metadataFile_log=metadataFile_log //log containing metadata of each Actor
        this.Signature_Validator_class= Signature_Validator//signature validator class
        this.create_public_key_function =create_public_key //function to create prublic key
        this.rules =Rules_object
        this.File_class= File_class
        this.auditor_file
        this.summary_file
    }
    async CallAuditor(mergedFile){// start auditor process
        const file_path= './Files/under_modifications/machinesFiles/summaryfile.txt'
        this.auditor_file = new this.File_class('closed/',mergedFile.name)
        this.summary_file = new this.File_class('closed/summary',mergedFile.name)
        await  this.summary_file.renameFile(file_path)
        Sorting(mergedFile.path, 'fileChunks_'+mergedFile.name ,this.Judge_evenEmitter)
        
     }  
     async applie_APOSTERIORI_SoftRules(lines,eventEmitter){
         this.rules.start_SoftRules(lines,this.machineIDS,this.Judge_evenEmitter,eventEmitter) 
     }
     async AllRules(lines){
        var masterFileContent = lines.map(element=>JSON.parse(element))
         var masterFile_APOST_HR = this.applie_APOSTERIORI_HardRules(masterFileContent)// applie aposteriori_HR on the mergedFile
        
       //var [masterFile_APRIORI] = this.applie_APRIORI_RULES(masterFile_APOST_HR,this.summary_file)// applie applie_APRIORI_RULES on the mergedFile
      var [masterFile_APRIORI] =[masterFile_APOST_HR ] //testing
        var[SigValidated_trans_array,SigValidated_ACK_array]= this.applie_SignatureValidator(masterFile_APRIORI) // validate signature of the messages
        // var masterFile_APOST_SR = this.applie_APOSTERIORI_SoftRules(SigValidated_trans_array,SigValidated_ACK_array)// applie aposteriori_SF on both transaction and Replie arrays
        var Request_Tampering= this.machineIDS.length >2 ? this.rules.applie_summary_hardrules(SigValidated_trans_array,this.summary_file): false; //control if there is a tampering issues in the transactions
        var Replie_Tampering =this.machineIDS.length  >2? this.rules.applie_summary_hardrules(SigValidated_ACK_array,this.summary_file):false//control if there is a tampering issues in the replies
         if(Replie_Tampering == true || Request_Tampering == true){ 
            console.log('**************************TAMPERING DETECTED******************************+')
        }
        var trans_ACK_array = await this.rules.applieTransactionReplieOrder(SigValidated_trans_array,SigValidated_ACK_array,this.machineIDS) //ordering the array 
        return trans_ACK_array
    }   
    
     events(){
        this.Judge_evenEmitter.on('FileCopied',(tmpfile)=>{
            let tempDir =path.basename(path.dirname(tmpfile));
            cleanUpTempFiles(tempDir)
            hashingFile(this.auditor_file, this.Judge_evenEmitter, 'JudgeFileHash')
 
         })
        this.Judge_evenEmitter.on('StandardDevExamDone',([ordered_array,eventEmitter])=>{
            eventEmitter.emit('start_Writing',(ordered_array))

        })
         this.Judge_evenEmitter.on('JudgeFileHash',(file_Hash)=>{
             console.log('Judge : ' , file_Hash, this.auditor_file.name)
             this.auditor_file.closeFiles('./Files/closed/masterFile/','./Files/closed/FileHash/', file_Hash,this.MetadataHash)          
             this.mainEventEmitter.emit('ExternelJudgeProcessISdone')
         })
         this.Judge_evenEmitter.on('ChunksSorted_duplicatesRemoved_Merged',async (outputFile_dirname)=>{
             var tempDir=path.join(os.tmpdir(), outputFile_dirname)
            var dirname =tempDir+'/'+this.auditor_file.name+'.txt'
            await this.auditor_file.copyTempFile(dirname,this.Judge_evenEmitter)
            
         })
 
         this.Judge_evenEmitter.on('RulesApplied',(Dirname)=>{
             sortDeleteMergeChunks(this.auditor_file.name+'.txt',Dirname,'tmp_auditorFile'+this.auditor_file.name,this.Judge_evenEmitter)
         })
         this.Judge_evenEmitter.on('ChunkedAndSorted',(ChunksDir)=>{
             applyRulesONchunks(ChunksDir,this)
         })
         
     }

     arrayTOfile(file,array){// append array_content to the auditorfile
        var string_array= array.map(str=>JSON.stringify(str))
        var auditor_string= string_array.join('\n')
        file.append_to_file(auditor_string)
        
    }

    applie_APOSTERIORI_HardRules(masterFileContent){
        let masterFileContent_ordered = this.rules.applieCorrectOrderRule(masterFileContent);// order the transactions based on the timestamp
        let masterFileContent_after_delete = this.rules.applieDeleteRepeated_msgs(masterFileContent_ordered);// delete the repeated transactions
        return masterFileContent_after_delete
    }
    applie_APRIORI_RULES(fileArray){
        var [array_result,Timestamp_errors_array]= this.APRIORI_RULES(fileArray)
        this.append_errors_to_File( Timestamp_errors_array,'Timestamp_errors: ')
        return array_result
    }
    applie_SignatureValidator(file_content){
        var [transacion_array,ACK_array]= this.split_array(file_content)
        var [trans_log_validated, trans_log_errors] = this.validate_sig_transacions(transacion_array)
        var [ACK_log_validated, ACK_log_errors] = this.validate_sig_ACK(ACK_array,transacion_array)
        var combined_error_arrays=[...trans_log_errors,...ACK_log_errors]
        this.append_errors_to_File( combined_error_arrays,'Signature_errors: ')
        return [trans_log_validated,ACK_log_validated]
    } 
    append_errors_to_File( array,title){// append errors to the summaryfile
        if(array.length != 0){
            this.summary_file.append_to_file('\n'+title+'\n' )
            let data= array.map(item => JSON.stringify(item)).join('\n'); 
            this.summary_file.append_to_file( data )}
    } 
    split_array(file_content){// split filedata into transactions and ACKs
        var transactions_array=[];var ACK_array=[]
        file_content.forEach(element => {
            if(element.Replier == undefined){
                transactions_array.push(element)
            }else{ACK_array.push(element)}
        });
        
        return [transactions_array,ACK_array]
    }
    transactionHash_creator(ack, transacion_array){
        let corresponding_transaction = transacion_array.find(
            (transacion_array) => transacion_array.Timestamp === ack.Timestamp && transacion_array.Requester === ack.Requester
          );
        let build_string =  corresponding_transaction.Requester+corresponding_transaction.Timestamp+corresponding_transaction.Data
        let transactionhash = crypto.createHash('sha256').update(build_string).digest('hex');
        return transactionhash  

    }
    validate_sig_ACK(ACK_array,transacion_array){
        var ACK_result_array=[]
        var ACK_log_errors=[]
        ACK_array.forEach(element => {
                var corresponding_dataActor = this.metadataFile_log.find(dataActor => dataActor.ID === element.Replier);
                var dataActor_publickey = this.create_public_key_function(corresponding_dataActor.PublicKey)
                var sig_val= new this.Signature_Validator_class(dataActor_publickey)
                let TransactionHash = element.TransactionHash == undefined ? this.transactionHash_creator(element,transacion_array) : element.TransactionHash
                var ACK_result= sig_val.validateSignature(element , 'external_JudgeACK',TransactionHash)
                this.TRUE_PUSH(ACK_result_array,ACK_result,element,ACK_log_errors)
                
        });
        return [ACK_result_array,ACK_log_errors]

    }
    validate_sig_transacions(transacion_array){
        var trans_log_errors=[]
        var trans_result_array=[]
        transacion_array.forEach(element => {
                var corresponding_dataActor = this.metadataFile_log.find(dataActor => dataActor.ID === element.Requester);
                var dataActor_publickey = this.create_public_key_function(corresponding_dataActor.PublicKey)
                var sig_val= new this.Signature_Validator_class(dataActor_publickey)
                var trans_result= sig_val.validateSignature(element , 'external_JudgeTransaction',this.MetadataHash)
                this.TRUE_PUSH(trans_result_array,trans_result,element,trans_log_errors)
            });
        return [trans_result_array,trans_log_errors]
    }
    TRUE_PUSH(array,result,element,errors_array){ //help function 
        if(result == true){array.push(element)}
        else if(result== false){errors_array.push(element)}

    }

}


module.exports = judge