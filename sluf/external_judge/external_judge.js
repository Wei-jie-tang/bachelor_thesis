
const path = require('path');
const mergingFiles = require('./largeData/merging')
const {decompressfile}= require('./decompress')
class external_Judge{
    constructor(configurationFile,File_class,main_eventEmitter,machineIDS){
        this.main_eventEmitter =main_eventEmitter //main process event emitter to return there
        this.configurationFile=configurationFile 
        this.events() //strat listening for the events
        this.machine_auditor_messages=[] // to collect auditor messages that are coming form the machines
        this.machine_summary_messages=[]// to collect summary messages that are coming form the machines
        this.File_class= File_class // file class to creates files needed 
        this.machineIDS = machineIDS
        
        
    }
    events(){
        this.main_eventEmitter.on('mergingISdone',(mergedFile)=>{
            this.main_eventEmitter.emit('START_JUDGE',mergedFile)
        })
        this.main_eventEmitter.on('summary_data',(filePath)=>{
            this.machine_summary_messages.push(filePath)
            console.log('summary' , this.machine_summary_messages.length)
        })
        this.main_eventEmitter.on('DecompressionDone', async ([myfile,filePaths_array])=>{
            let file_name= 'masterfile_' +Date.now() 
            let mergedFile = new this.File_class('under_modifications/masterFile',file_name)
            let referenceFile = new  this.File_class('under_modifications/machinesFiles','myfile',false) // create a merged file to store the data in before the judge process for contol 
            await referenceFile.renameFile(myfile)
            mergingFiles(mergedFile , this.main_eventEmitter,filePaths_array,referenceFile)

        })
        this.main_eventEmitter.on('machine_data',(file_path)=>{ // if data comes form the machine
            this.machine_auditor_messages.push(file_path)
            console.log('data ', this.machine_auditor_messages.length)
            if(this.machineIDS.length == this.machine_auditor_messages.length   ){ 
                var timer= setInterval(() => {
                    if(this.machine_auditor_messages.length == this.machineIDS.length){
                        clearInterval(timer)
                        var myfile = this.machine_auditor_messages.shift()
                        var filePaths_array= this.machine_auditor_messages
                        decompressfile(myfile,this.main_eventEmitter,filePaths_array,this.machine_summary_messages)
                        this.machine_auditor_messages=[] //re-initialisation
                        this.machine_summary_messages=[] //re-initialisation
                        
                        
                    }
                    
                }, 100);
            
        }
    })
    }
}
module.exports= external_Judge