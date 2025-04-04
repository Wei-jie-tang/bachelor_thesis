const fs = require('fs');

/**
 * @brief File
 *
 * This class creates a txt File object and append content to it
 *
 * @param name: name of the file 
 * 
 * @return file
 */

class File{
    constructor(ordner,name,create=true){
        this.name=name
        this.path= './Files/'+ordner+'/' + this.name + '.txt'
        if(create==true){this.create_File()}
        
        
    }
    create_File(){ //create a txt file 
        var createStream = fs.createWriteStream(this.path);
        return createStream
      

    }
    append_to_file(content,flag=true,name=''){ // append the content to the file 
        if(flag == true){
            fs.appendFile(this.path, name +content+ '\n', err => {
                if (err) {
                  console.log('error in the append', this.path);
                }else{
                  
                }
                // done!
              });
        }
    }
    delete_file(){
        fs.unlink(this.path, (err) => {
            if (err) {
              console.error('file not Found');
            } else {
              console.log('File is deleted.');
            }
          });
    }
  async renameFileObject(newPath){
    const fs_rename = require('fs').promises;
    await fs_rename.rename(this.path, newPath);
    console.log(`File renamed successfully to ${newPath}` );
  }
  async renameFile(oldpath){
    const fs_rename = require('fs').promises;
    await fs_rename.rename(oldpath, this.path);
    console.log(`File renamed successfully to ${this.path}` );
  }

<<<<<<< HEAD
   async copyFileObject(mergedFile,eventEmitter){
      return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(this.path);
        const writeStream = fs.createWriteStream(mergedFile.path);
=======
  async copyFileObject(mergedFile,eventEmitter){
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(this.path);
      const writeStream = fs.createWriteStream(mergedFile.path);
  
      // Copy each data chunk manually
      readStream.on('data', (chunk) => {
        const canWrite = writeStream.write(chunk);
        if (!canWrite) {
          readStream.pause(); // Pause if the write buffer is full
          writeStream.once('drain', () => readStream.resume()); // Resume after draining
        }
      });
  
      // End the write stream when the read stream ends
      readStream.on('end', () => {
        writeStream.end();
      });
  
      // Resolve the promise when the write stream finishes
      writeStream.on('finish', () => {
        
      });
  
      // Handle errors
      readStream.on('error', (err) => reject(err));
      writeStream.on('error', (err) => reject(err));
      // Closing events to confirm file descriptors are closed
      readStream.on('close', () => console.log('Read stream closed.'));
      writeStream.on('close', () => {
        console.log('File was copied successfully to ', mergedFile.path);
        eventEmitter.emit('FileCopied',mergedFile)
        resolve();
      });
    });
    
  }
    
  async copyTempFile(oldpath,eventEmitter){
      return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(oldpath);
        const writeStream = fs.createWriteStream(this.path);
>>>>>>> 970deb0 (Overwriting main branch with new folder)
    
        // Copy each data chunk manually
        readStream.on('data', (chunk) => {
          const canWrite = writeStream.write(chunk);
          if (!canWrite) {
            readStream.pause(); // Pause if the write buffer is full
            writeStream.once('drain', () => readStream.resume()); // Resume after draining
          }
        });
    
        // End the write stream when the read stream ends
        readStream.on('end', () => {
          writeStream.end();
        });
    
        // Resolve the promise when the write stream finishes
        writeStream.on('finish', () => {
<<<<<<< HEAD
          
=======
         
>>>>>>> 970deb0 (Overwriting main branch with new folder)
        });
    
        // Handle errors
        readStream.on('error', (err) => reject(err));
        writeStream.on('error', (err) => reject(err));
        // Closing events to confirm file descriptors are closed
        readStream.on('close', () => console.log('Read stream closed.'));
        writeStream.on('close', () => {
<<<<<<< HEAD
          console.log('File was copied successfully to ', mergedFile.path);
          this.control_size(this.path,mergedFile.path,eventEmitter, mergedFile)
          resolve();
        });
      });
      
    }
      
    async copyTempFile(oldpath,eventEmitter){
        return new Promise((resolve, reject) => {
          const readStream = fs.createReadStream(oldpath);
          const writeStream = fs.createWriteStream(this.path);
      
          // Copy each data chunk manually
          readStream.on('data', (chunk) => {
            const canWrite = writeStream.write(chunk);
            if (!canWrite) {
              readStream.pause(); // Pause if the write buffer is full
              writeStream.once('drain', () => readStream.resume()); // Resume after draining
            }
          });
      
          // End the write stream when the read stream ends
          readStream.on('end', () => {
            writeStream.end();
          });
      
          // Resolve the promise when the write stream finishes
          writeStream.on('finish', () => {
           
          });
      
          // Handle errors
          readStream.on('error', (err) => reject(err));
          writeStream.on('error', (err) => reject(err));
          // Closing events to confirm file descriptors are closed
          readStream.on('close', () => console.log('Read stream closed.'));
          writeStream.on('close', () => {
            console.log('File was copied successfully to ', this.path);
            this.control_size(oldpath,this.path,eventEmitter, oldpath)
            resolve();
          });
          
        });
        
      }

    control_size(oldpath,newpath,eventEmitter,file){
      var old_filesize = fs.statSync(oldpath).size;
      var timer =setInterval(() => {
        var new_filesize = fs.statSync(newpath).size;
        if(new_filesize == old_filesize){
          clearInterval(timer)
          console.log('emitted\n')
          eventEmitter.emit('FileCopied',(file))

        }
      }, 1);
    }
=======
          console.log('File was copied successfully to ', this.path);
          eventEmitter.emit('FileCopied',(oldpath))
          resolve();
        });
        
      });
      
    }
  
>>>>>>> 970deb0 (Overwriting main branch with new folder)
  closeFiles(closePath,filehashPath, filehash,metadata_hash){
    const masterfilewriteStream = fs.createWriteStream(closePath + this.name+'.txt', {flags : 'a'});
    const masterFilereadStream = fs.createReadStream(this.path);
    const fileHashwriteStream = fs.createWriteStream(filehashPath + this.name+'.txt');
    fileHashwriteStream.write(filehash)
    masterfilewriteStream.write(metadata_hash+'\n')
    masterFilereadStream.pipe(masterfilewriteStream)
    masterfilewriteStream.on('error', (err) => {
      console.error('Error writing to the destination file:', err);
    });
    
    // Log completion when the writing is done
    masterfilewriteStream.on('finish', () => {
      this.delete_file()
      console.log('File has been successfully copied.\n\n');
    });
  }
    
    
}
<<<<<<< HEAD
module.exports= File
=======
module.exports= File
>>>>>>> 970deb0 (Overwriting main branch with new folder)
