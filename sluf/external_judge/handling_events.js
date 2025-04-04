const fs = require('fs');


function handling_events(mainEventEmitter,judge_object){
    mainEventEmitter.on('START_JUDGE',(mergedFile)=>{ // start judge process
        judge_object.CallAuditor(mergedFile)
    })
    mainEventEmitter.on('ExternelJudgeProcessISdone',()=>{ // judge process is done
        console.log('********Process is Done**********')
        
    })
}

module.exports = {handling_events}