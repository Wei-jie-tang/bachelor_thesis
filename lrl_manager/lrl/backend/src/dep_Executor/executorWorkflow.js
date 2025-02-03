const http = require('http');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const busboy = require('busboy');
const client = require('./client.js');
const { validateSignature } = require('@/common/signature_verifier.js');
const { bench, exportBenchmarks } = require('@/common/benchmark/bench.js');

// Contract & options
let contract;
let options;

// HTTP Parameters
const port = 8080;
let inheritorIP;

// LRL Parameters
let lastHeartbeat;
let heartbeatTimeout;
let assetState_enc;

// Received data
let filename = '';
let shamirKey;

// LocalMachine public key
const publicKeyPath = path.join(__dirname, 'keys', 'public2.pem');
const keydata = fs.readFileSync(publicKeyPath, 'utf8');

function localMachineDown() {
  bench('LM_FAIL' + lastHeartbeat);
  console.log('\n++++++++++ Local Machine Down ++++++++++\n');
  if (!inheritorIP) {
    // Wait for IP
    console.log('Waiting for Inheritor IP...');
    setTimeout(localMachineDown, 500);
    return;
  }

  bench('ASSET_MIGRATE' + filename);
  client.post_asset(inheritorIP, port, filename);
  client.post_shamirKey(inheritorIP, port, shamirKey);
  client.post_assetState(inheritorIP, port, JSON.stringify(assetState_enc));
  exportBenchmarks();
}

async function getInheritorIP() {
  const inheritorChosenEvents = await contract.getPastEvents(
    'InheritorChosen',
    {
      filter: { assetID: options.assetID },
      fromBlock: 0,
      toBlock: 'latest',
    }
  );

  const inheritorAddress = inheritorChosenEvents[0].returnValues.addr;

  const newNodeEvents = await contract.getPastEvents('NewNode', {
    filter: { addr: inheritorAddress },
    fromBlock: 0,
    toBlock: 'latest',
  });

  return newNodeEvents[0].returnValues.IP;
}

exports.testamentorWorkflow = async function (_contract, _options) {
  bench('TM-START' + _options.address);
  console.log('\n----------START TESTAMENTOR----------\n');

  contract = _contract;
  options = _options;

  // Find inheritor
  getInheritorIP().then((IP) => {
    inheritorIP = IP;
  });

  http
    .createServer((req, res) => {
      let body = [];
      switch (req.url) {
        /// Heartbeat receiver ///
        case '/heartbeat':
          req
            .on('error', (err) => {
              console.error(err);
            })
            .on('data', (chunk) => {
              body.push(chunk);
            })
            .on('end', () => {
              body = Buffer.concat(body).toString();
              let data = JSON.parse(body);

              // Verify Heartbeat
              const timestamp = data.Timestamp;
              const signature = data.Signature;

              if (!validateSignature(timestamp, signature, keydata)) {
                console.log('Timestamp not valid.');
                res.statusCode = 401;
                res.end();
                return;
              }

              if (!lastHeartbeat) {
                // First heartbeat
                console.log('First heartbeat received.');
                heartbeatTimeout = setTimeout(localMachineDown, 3100);
              } else {
                console.log(
                  'Received valid heartbeat. Time since last heartbeat: ',
                  data.Timestamp - lastHeartbeat
                );
                clearInterval(heartbeatTimeout);
                heartbeatTimeout = setTimeout(localMachineDown, 3100);
                res.statusCode = 200;
              }

              lastHeartbeat = data.Timestamp;
              assetState_enc = data.State;
            });
          res.end(options.address);
          break;
        /// ASSET PIECE RECEIVER ///
        case '/asset':
          req.on('error', (err) => {
            console.error(err);
          });
          const bb = busboy({ headers: req.headers });
          bb.on('file', (name, file, info) => {
            filename = info.filename;
            const dest = path.join(__dirname, 'temp', filename);
            file.pipe(fs.createWriteStream(dest));
            assetPiecePath = dest;
          });
          bb.on('close', () => {
            console.log(`Asset piece received.`);
            res.writeHead(201, { 'Content-Type': 'text/plain' });
            res.end(`${options.address} received Asset piece.`);
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
              shamirKey = Buffer.concat(body);
            });
          console.log(`Shamir key received.`);
          res.statusCode = 201;
          res.end(`${options.address} received Shamir key.`);
          break;
        default:
          console.log('Received a request...');
          res.end('This works...');
      }
    })
    .listen(port);

  /**
   * options = {
   *  nodeAddress,
   *  nodeIP,
   *  nodeResources,
   *  assetID
   * }
   */
  //   let asset = {}
  //   let heartbeatInterval;
  //   // Find IPS
  //
  //   contract.getPastEvents('NewAsset', {    // Find Owner Address and IP
  //     filter: { assetID: options.assetID },
  //     fromBlock: 0,
  //     toBlock: 'latest' })
  //       .then((events) => {
  //         if (err) throw err;
  //         asset.owner.address = events[0].returnValues.owner.toLocaleLowercase();
  //       })
  //       .then(() => {
  //         contract.getPastEvents('NewNode', {
  //           filter: { addr: asset.owner.address },
  //           fromBlock: 0,
  //           toBlock: 'latest'
  //         }, (err, events) => {
  //           asset.owner.IP = events[0].returnValues.IP;
  //           /// Start checking Heartbeat ///
  //           heartbeatInterval = setInterval(() => { checkHeartbeat(asset.owner.IP) }, 5000);
  //         });
  //       });
  //
  //   contract.getPastEvents('InheritorChosen', {   // Find Inheritor Address and IP
  //     filter: { assetID: options.assetID },
  //     fromBlock: 0,
  //     toBlock: 'latest' })
  //       .then((err, events) => {
  //         if (err) throw err;
  //         asset.inheritor.address = events[0].returnValues.inheritor.toLocaleLowercase();
  //       })
  //       .then(() => {
  //         contract.getPastEvents('NewNode', {
  //           filter: { addr: asset.inheritor.address },
  //           fromBlock: 0,
  //           toBlock: 'latest'
  //         }, (err, events) => {
  //           asset.inheritor.IP = events[0].returnValues.IP;
  //         });
  //       });
  //
  // ON FAILURE
  // Check with other testamentors
  // ON CONSENSUS
  // Send asset_pc and key_testament_pc to Inheritor
};

function checkHeartbeat(IP) {
  https.get(IP + '/heartbeat', (res) => {});
}

function handleLocalMachineFailure() {
  // PUT asset_pc to inheritor
  https.put(asset.inheritor.IP + '/asset', (res) => {});

  // PUT key_pc to inheritor
  https.put(asset.inheritor.IP + '/key', (res) => {});
}

/*
function testamentorWorkflow(contract_instance, thisNodeIP, localMachineIP, inheritorIP, assetId, options) {

  const http_server = require("../common/networkFiles/http_server")
  const http_client = require("../common/networkFiles/http_client")
  const path = require('path');
  const fs = require("fs")
  const shell = require("shelljs")
  const net = require('net')


  try { fs.unlinkSync("../../transfer_resources/assetPiece_asTestament/" + "encAssetPiece" + thisNodeIP.slice(-1)) } catch { }

  // receive a piece of the encrypted asset from Local Machine
  setTimeout(function () {
    var i = 0
    while (i < 2) {
      http_client.http_client(localMachineIP, "assetPiece_asTestament/", "encAssetPiece" + thisNodeIP.slice(-1) + "-" + i, "3" + (i + 3) + "0" + thisNodeIP.slice(-1))
      i++
    }
  }, 1000)
  console.log("==> Received a piece of the encrypted asset from Local Machine\n")

  // receive a Shamir secret key from Local Machine
  setTimeout(function () {
    http_client.http_client(localMachineIP, "shamirKey_asTestament/", "shamirKey" + thisNodeIP.slice(-1) + ".txt", "301" + thisNodeIP.slice(-1))
  }, 1050)
  console.log("==> Received a Shamir secret key from Local Machine\n")

  console.log("bench mark: " + Date.now())

  //var checkingHeartBeat = setInterval(() => {
  // used = process.memoryUsage().heapUsed / 1024 / 1024;
  // console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
  // new Promise(function (resolve, reject) {
  //var queryHeartBeat = shell.exec(getHeartBeatCMD, { silent: true })
  //currentTime = Math.floor(Date.now() / 10000)
  const client = new net.Socket();

  client.connect(3001, localMachineIP, () => {
    console.log('Connected to TCP server');

  });
  setTimeout(() => {
    client.on('data', (data) => {
      const queryHeartBeat = parseInt(data.toString());
      console.log('Local Machine heart beat: ' + queryHeartBeat)
    })
  }, 3000)

  client.on('close', () => {
    console.log('Local Machine is down.');
    // Sync with Blockchain
    let inheritorAddress;
    contract_instance.getPastEvents("NewNode", {
      filter: { IP: inheritorIP },
      fromBlock: 0,
      toBlock: 'latest'
    }).then((err, events) => {
      if (err) throw err;

      inheritorAddress = events[0].returnValues.addr;
      contract_instance.methods.transferAsset(assetId, inheritorAddress).send(options)
    });
    // send the stored shamir secret key to the Inheritor

    // send the stored shamir secret key to the Inheritor
    setTimeout(function () {
      http_server.http_server(thisNodeIP, "shamirKey_asTestament/", "shamirKey" + thisNodeIP.slice(-1) + ".txt", "320" + inheritorIP.slice(-1), inheritorIP)
    }, 1100)
    console.log("==> Sending the stored shamir secret key to the Inheritor\n")


    // send the stored piece of the encrypted asset to the inheritor
    setTimeout(function () {
      var i = 0
      while (i < 2) {
        http_server.http_server(thisNodeIP, "assetPiece_asTestament/", "encAssetPiece" + thisNodeIP.slice(-1) + "-" + i, "32" + (i + 1) + inheritorIP.slice(-1), inheritorIP)
        i++
      }
    }, 1250)
    console.log("==> Sending the stored piece of the encrypted asset to the inheritor\n")
  })
  //}, 7000);



}
*/
