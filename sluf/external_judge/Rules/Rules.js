const {message_hardRules, correct_order,delete_repeated_msgs,transaction_replie_order}=require('./msgverification_hardrules')
const message_softRules=require('./msgverification_softrules')
const {summary_fileHash_Hardrules,summary_hardrules}= require('./summary_rules')
const applie_standardDev =require('./standard_dev');
const {splitByData}= require('./SOFT_on_chunks')
var events = require('events');


class Rules{
    constructor(streaming){
        this.streaming=streaming // no soft rules
    }
    applie_msgHardRules(msg){return message_hardRules(msg) }// we need these methods seperated for the judge
    applie_msgSoftRules(msg){return message_softRules(msg.Data) }
    
    message_rules(message){ // a_priori_rules : rules applied on the messages (msg by msg)
        let hardRules_message_verification= this.applie_msgHardRules(message)
        let softRules_message_verification =(this.streaming == false && message.Data != undefined) ? this.applie_msgSoftRules(message): true;
        if(hardRules_message_verification == true && softRules_message_verification == true){
            return true
        }else{return false}
        
    }
    applieCorrectOrderRule(log){return correct_order(log);}
    applieDeleteRepeated_msgs(log){return delete_repeated_msgs(log);}
    async applieTransactionReplieOrder(log1,log2,machineIDS){
        var result = await transaction_replie_order(log1,log2,machineIDS)
        return result
    }


     file_rules(transaction_log, replie_log){ // a_posteriori_rules: rules applied on the hole file  
        let transaction_log_ordered=this.applieCorrectOrderRule(transaction_log);
        let replie_log_ordered = this.applieCorrectOrderRule(replie_log);
        let transaction_array_after_delete = this.applieDeleteRepeated_msgs(transaction_log_ordered);
        let replie_array_after_delete = this.applieDeleteRepeated_msgs(replie_log_ordered);
        let trans_replie_log= this.applieTransactionReplieOrder(transaction_array_after_delete,replie_array_after_delete)
        return trans_replie_log

    }
    fileHash_Hardrules(file,judge_eventemitter){
        summary_fileHash_Hardrules(file,judge_eventemitter)
    }
    applie_summary_hardrules(TimestampError_array,SignatureError_array,summary_file){
        return summary_hardrules(TimestampError_array,SignatureError_array,summary_file)
    }
    async start_SoftRules(lines,machineIDS,judge_eventemitter,eventEmitter){
        if(this.streaming == false){
            var chuncking_lines=  await splitByData(lines)
            var process_eventEmitter = new events.EventEmitter()
            process_eventEmitter.on('StandardDevExamDone',(ordered_array)=>{
                judge_eventemitter.emit('StandardDevExamDone', ([ordered_array,eventEmitter]))
              })
             applie_standardDev(chuncking_lines,process_eventEmitter,machineIDS)
            }else{
                judge_eventemitter.emit('StandardDevExamDone', ([lines,eventEmitter]))
            }

        
            
        }

}
module.exports= Rules