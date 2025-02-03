async function splitFiles(filename, nodesNumber) {


  const splitFile = require('split-file');

  const fs = require('fs');

  let filePath = './transfer_resources/asset_encrypted/' + filename


  const file_size = fs.statSync(filePath).size;

  let chunkSize = Math.ceil(file_size / nodesNumber);

  await splitFile.splitFileBySize(filePath, chunkSize, "./transfer_resources/asset_encrypted_splitted")

    .then((names) => {

      console.log('\nThe splitted files were placed in ./transfer_resources/asset_encrypted_splitted\n');

    })

    .catch((err) => {

      console.log('Error: ', err);

    });

    return 1

  }


module.exports={splitFiles}
