
const zlib = require('zlib');
const fs = require('fs');
const readline = require('readline');


async function decompressfile(gzFilePath,eventEmitter,filePaths_array,machine_summary_messages){
    await merge_summary(machine_summary_messages)
    fs.createReadStream(gzFilePath+'.gz')
    .pipe(zlib.createGunzip())
    .pipe(fs.createWriteStream(gzFilePath))
    .on('finish', () => {
      console.log('File decompressed.', gzFilePath);
      eventEmitter.emit('DecompressionDone',([gzFilePath,filePaths_array]))
      
      
    })

}
async function merge_summary(machine_summary_messages){
    const file_path= './Files/under_modifications/machinesFiles/summaryfile.txt'
    var writeStream =fs.createWriteStream(file_path,{flags:'a'})
    machine_summary_messages.forEach(filePath => {
         var readStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({
        input: readStream,
        crlfDelay: Infinity
      });
      rl.on('line', (line) => {
        writeStream.write(line + '\n')
       
      });
      
      // Handle errors from the read stream
      readStream.on('error', (err) => {
        console.error('Error reading file:', err);
      });
      
      // Event listener for the end of the file
      rl.on('close', () => {
        console.log('done')
       
      });
        
    });
  
       
    
} 
function delete_file(path){
  fs.unlink(path, (err) => {
      if (err) {
        console.error('file not Found');
      } else {
        console.log('File is deleted.');
      }
    });
}

module.exports={decompressfile,delete_file}