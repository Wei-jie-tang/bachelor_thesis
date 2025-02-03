const fs = require('fs');
const path = require('path');
const http = require('http');
const busboy = require('busboy');
const sss = require('shamirs-secret-sharing');
const splitFile = require('split-file');
const { decryptFile } = require('@/common/encryption.js');
const EventEmitter = require('events');
const contractInterface = require('@/contract/interface.js');
const { bench, exportBenchmarks } = require('@/common/benchmark/bench.js');
const docker = require('@/common/cmd/docker.js');

// Host communication
const pipePath = '/hostpipe/mypipe';
const pipeOutput = '/hostpipe/output.txt';

// CONSTANTS
const host = 'localhost';
const port = 8080;
const DATADIR = __dirname + '/data/';
const TEMPDIR = __dirname + '/temp/';
let contract;
let options;
let bb;
let assetPieces = [];
let shamirKeys = [];
let testament_enc_Path;
let assetState;
let numTestamentors;
let pollingInterval;

// Commands

async function restoreAsset() {
  console.log('Start redeploying asset...\n');
  bench('RESORE_START');
  clearInterval(pollingInterval);
  // Decrypt testament
  const recovered = sss.combine(shamirKeys).toString();
  const testamentKey = recovered.split('/')[0];
  const iv = new Uint8Array(recovered.split('/')[1].split(','));
  console.log('Decrypting Testament...');
  await decryptFile(
    path.join(__dirname, 'temp', 'testament.enc'),
    __dirname + '/data/',
    testamentKey,
    iv,
    '.json'
  );
  const testament = JSON.parse(
    fs.readFileSync(__dirname + '/data/testament.json')
  );
  console.log('Testament decrypted successuflly!\n');

  return new Promise(async (resolve, reject) => {
    // Merge asset
    let pieces = [];
    testament.files.forEach((name) => {
      pieces.push(path.join(__dirname, 'temp', name));
    });
    console.log('Merging asset...');
    bench('MERGE_START');
    splitFile
      .mergeFiles(pieces, path.join(__dirname, 'temp', 'asset.enc'))
      .then(async () => {
        bench('MERGE_STOP');
        console.log('Asset merged successfully!\n');
        // Decrypt asset & asset state
        const iv = new Uint8Array(testament.iv.split(','));
        console.log('Decrypting asset...');
        bench('DECRYPTION_START');
        await decryptFile(
          __dirname + '/temp/asset.enc',
          __dirname + '/data/',
          testament.assetKey,
          iv,
          testament.assetFileExtension
        );
        bench('DECRYPTION_STOP');
        console.log(`Asset decrypted successfully.\n`);
        // Delete temp files
        fs.readdir(path.join(__dirname, 'temp'), (err, files) => {
          if (err) throw err;

          for (const file of files) {
            fs.unlink(path.join(__dirname, 'temp', file), (err) => {
              if (err) throw err;
            });
          }
        });
        resolve(testament.NFTKey);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

async function deployAsset(password) {
  bench('DEPLOY_START');
  let timeout = 200000;
  const timeoutStart = Date.now();
  return new Promise((resolve, reject) => {
    let timeoutInterval = setInterval(() => {
      if (Date.now() - timeoutStart > timeout) {
        clearInterval(timeoutInterval);
        throw new Error("Timed out at 'deploy asset'");
      } else {
        if (fs.existsSync('/hostpipe/asset/asset.tar')) {
          clearInterval(timeoutInterval);
          const imagePath =
            '/home/cca/Documents/ethereum_lrl/data/asset/asset.tar';

          docker
            .load(imagePath)
            .then((imageId) => {
              //const imageId = fs.readFileSync(pipeOutput).toString();
              console.log(imageId);
              return docker.run(imageId);
            })
            .then(async (containerId) => {
              await contractInterface.transferAsset(
                contract,
                options.address,
                password,
                options
              );
              bench('DEPLOY_STOP');
              resolve();
            })
            .catch((error) => {
              reject(error);
            });
        }
      }
    }, 300);
  });
}

exports.inheritorWorkflow = async function (_contract, _options) {
  bench('IN-START');
  console.log('\n----------START INHERITOR----------\n');

  contract = _contract;
  options = _options;

  contract.events
    .Transfer()
    .on('error', (err) => {
      console.log(err);
    })
    .on('data', (event) => {
      exportBenchmarks();
      const returnValues = event.returnValues;
      console.log(
        `Successfully transfered asset #${returnValues.tokenId} from ${returnValues.from} to ${returnValues.to}`
      );
    });

  let testamentorsEvents = await contract.getPastEvents('TestamentorChosen', {
    filter: { ID: options.assetID },
    fromBlock: 0,
    toBlock: 'latest',
  });
  numTestamentors = testamentorsEvents.length;
  console.log(`Number of Testamentors: ${numTestamentors}\n`);

  pollingInterval = setInterval(async () => {
    if (testament_enc_Path === undefined) {
      // No Testament
      return;
    }
    if (shamirKeys.length < numTestamentors / 2) {
      // Not enough keys
      return;
    }
    if (assetPieces.length < numTestamentors) {
      // Not all asset pieces
      return;
    }
    if (assetState === undefined) {
      // No asset state
      return;
    }

    restoreAsset()
      .then((password) => {
        return deployAsset(password);
      })
      .catch((e) => {
        console.log(e.message);
        process.exit(1);
      });
  }, 1000);

  http
    .createServer((req, res) => {
      let body = [];
      switch (req.url) {
        /// TESTAMENT RECEIVER ///
        case '/testament':
          req.on('error', (err) => {
            console.error(err);
          });
          let filename = '';
          bb = busboy({ headers: req.headers });
          bb.on('file', (name, file, info) => {
            filename = info.filename;
            const dest = path.join(__dirname, 'temp', filename);
            file.pipe(fs.createWriteStream(dest));
          });
          bb.on('close', () => {
            console.log(`Testament received.`);
            res.writeHead(201, { 'Content-Type': 'text/plain' });
            res.end(`${options.address} received Testament.`);
            testament_enc_Path = path.join(__dirname, 'temp', filename);
          });
          req.pipe(bb);
          break;
        /// ASSET PIECE RECEIVER ///
        case '/asset':
          req.on('error', (err) => {
            console.error(err);
          });
          let pieceName = '';
          bb = busboy({ headers: req.headers });
          bb.on('file', (name, file, info) => {
            pieceName = info.filename;
            const dest = path.join(__dirname, 'temp', pieceName);
            file.pipe(fs.createWriteStream(dest));
          });
          bb.on('close', () => {
            bench('ASSET_RECEIVE' + pieceName);
            console.log(`Asset piece received: ${pieceName}\n`);
            res.writeHead(201, { 'Content-Type': 'text/plain' });
            res.end(`${options.address} received asset piece.`);
            assetPieces.push(pieceName);
          });
          req.pipe(bb);
          break;
        /// SHAMIR KEY RECEIVER ///
        case '/key':
          req
            .on('error', (err) => {
              console.error(err);
            })
            .on('data', (chunk) => {
              body.push(chunk);
            })
            .on('end', () => {
              shamirKeys.push(Buffer.concat(body));
            });
          res.statusCode = 201;
          res.end(`${options.address} received shamir key.`);
          break;
        /// ASSET STATE RECEIVER ///
        case '/state':
          req
            .on('error', (err) => {
              console.error(err);
            })
            .on('data', (chunk) => {
              body.push(chunk);
            })
            .on('end', () => {
              assetState = JSON.parse(Buffer.concat(body));
              fs.writeFileSync(
                __dirname + '/data/state.json',
                JSON.stringify(assetState)
              );
            });

          res.statusCode = 201;
          res.end(`${options.address} received asset state.`);
          break;
      }
    })
    .listen(port);
  /**
   * options = {
   *  address,
   *  IP,
   *  nodeResources,
   *  assetID
   * }
   */

  // ON RECEIVE COMPLETE
  // Decrypt Testament
  // Merge asset_encrypted
  // Decrypt asset_encrypted
};
