const fs = require('fs')
const path = require('path')
const Sorting = require('./sortChunks')
const sortDeleteMergeChunks=require('./mergeChunks')
const events = require('events')
const readline = require('readline');
const splitbothFiles=require('./splitfile')
const processFiles= require('./processingFiles')
const create_directory= require('./os')
const cleanUpTempFiles= require('./clean')

 async function mergingFiles(mergedFile ,eventEmitter,filePaths_array,myfile) {
    var my_tmpDir= await create_directory( myfile.name)
    var dirname= myfile.name+'/'
    let merging_eventEmitter= new events.EventEmitter()
    var i =0
    merging_eventEmitter.on('FileCopied',async (mergedfileRenamed)=>{
        cleanUpTempFiles(my_tmpDir)
        eventEmitter.emit('mergingISdone',mergedfileRenamed)
    })
    merging_eventEmitter.on('mergingISdone', async ()=>{
        i++ 
        if(i== filePaths_array.length ){
            await myfile.copyFileObject(mergedFile.path)
            


        }
    })
    
    
    merging_eventEmitter.on('ChunksSorted_duplicatesRemoved_Merged',async (merging_temp_dir_name)=>{
         await splitbothFiles(myfile.path, merging_temp_dir_name+'/sorted_others_file.txt',dirname+'myfileChunks_'+ myfile.name,dirname+'othersfileChunks_'+path.basename(merging_temp_dir_name, path.extname(merging_temp_dir_name)) )
        await processFiles(myfile.path,dirname+'myfileChunks_'+ myfile.name,dirname+'othersfileChunks_'+ path.basename(merging_temp_dir_name, path.extname(merging_temp_dir_name)),merging_eventEmitter)
    })
    merging_eventEmitter.on('ChunkedAndSorted', (sorting_temp_dir_name)=>{
        var merging_temp_dir_name =dirname+'merging_after_'+path.basename(sorting_temp_dir_name, path.extname(sorting_temp_dir_name))
        sortDeleteMergeChunks('sorted_others_file.txt',sorting_temp_dir_name, merging_temp_dir_name,merging_eventEmitter)
    })
    for(let i=0; i< filePaths_array.length ; i++){
        start_mergingProcess(merging_eventEmitter,myfile, filePaths_array[i],dirname)
    }
    
        
        
}

function start_mergingProcess(merging_eventEmitter,myfile,othersfilepath,dirname){
    var sorting_temp_dir_name =dirname+'sorting_'+  path.basename(othersfilepath, path.extname(othersfilepath))
    console.log(sorting_temp_dir_name)
    Sorting(othersfilepath+'.gz', sorting_temp_dir_name ,merging_eventEmitter) // only the othersfile should be sorted
}
module.exports= mergingFiles
