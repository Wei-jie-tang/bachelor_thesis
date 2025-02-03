const crypto = require("crypto");
const sss = require("shamirs-secret-sharing");
const fs = require("fs");
const path = require("path");
const client = require("./client");
const splitFile = require("split-file");
const contractInterface = require("@/contract/interface");
const { encryptFile } = require("@/common/encryption");
const { migrationDecision } = require("./migrationDecision");
const { createTransaction } = require("@/common/transaction_creator.js");
const { bench } = require("@/common/benchmark/bench.js");
const EventEmitter = require("events");
const events = new EventEmitter();
const docker = require("@/common/cmd/docker.js");

const TOTRANSFER = "asset1.jpg";

// HTTP Variables
const port = 8080;
const host = "localhost";

// ALgorithm Variables
const assetKey = "password"; // Optionally create Random string or use environment variable
const testamentKey = "different password"; // Optionally create Random string or use environment variable
const NFTKey = "another password";
const privateKeyPath = path.join(__dirname, "keys", "private2.pem");

// exports.getHeartbeat = function() { return heartbeat; };  // Send encrypted (aes-256) state with signed heartbeat
let allNodes = [];
let testament = {};
let assetRequirements;
let inheritor = {};
let testamentors = [];
let contract;
let options = {};
let shamirKeys;

// POST Error handler
client.events.on("POST_Error", (type, params) => {
  const IP = params[0];
  switch (type) {
    case "heartbeat":
      break;
    case "asset":
      console.log(`Error sending asset to ${IP}. Retrying in 2 seconds...`);
      setTimeout(() => {
        client.post_assetPiece(...params);
      }, 2000);
      break;
    case "key":
      console.log(
        `Error sending Shamir key to ${IP}. Retrying in 2 seconds...`
      );
      setTimeout(() => {
        client.post_shamirKey(...params);
      }, 2000);
      break;
    case "testament":
      console.log(`Error sending Testament to ${IP}. Retrying in 2 seconds...`);
      setTimeout(() => {
        client.post_testament(...params);
      }, 2000);
      break;
  }
});

// MAIN function
module.exports = async function (_contract, _options) {
  console.log("\n----------START LOCAL MACHINE----------\n");
  contract = _contract;
  options.lrl = _options;
  /**
   * options.lrl = {
   *  address,
   *  IP,
   *  nodeResources,
   *  assetID,
   *  localMachine = {
   *    privateKey,
   *    publicKey
   *  }
   * }
   */

  // Set heartbeat
  setInterval(async function () {
    heartbeat = Date.now().toString();
    const transaction = JSON.parse(createTransaction(privateKeyPath));

    let statePath = path.join(__dirname, "asset", "state.json");
    // let dest = path.join(__dirname, 'temp');
    // let encryption = await encryptFile(statePath, dest, assetKey);
    // let state_enc = fs.readFileSync(encryption.dest);
    transaction.State = JSON.parse(fs.readFileSync(statePath));

    const postData = JSON.stringify(transaction);
    //for (let testamentor of testamentors) {
    //  client.post_heartbeat(testamentor.IP, port, postData);
    //}
    client.post_heartbeat("node3", port, postData);
    client.post_heartbeat("node4", port, postData);
  }, 1500);

  // Set password for asset-transfer
  contractInterface.setPassword(
    contract,
    options.lrl.assetID,
    NFTKey,
    options.lrl
  );
  testament.NFTKey = NFTKey;

  // Get all Nodes
  const newNodeEvents = await contract.getPastEvents("NewNode", {
    fromBlock: 0,
    toBlock: "latest",
  });
  const newAssetEvents = await contract.getPastEvents("NewAsset", {
    filter: { ID: options.lrl.assetID },
    fromBlock: 0,
    toBlock: "latest",
  });

  allNodes = getAllNodes(newNodeEvents);
  /**
   * allNodes = [{
   *   address: string,
   *   IP: string,
   *   resourceStatus: Object(resources)
   * }]
   */
  assetRequirements = getRequirements(newAssetEvents);

  getInheritor();
  getTestamentors();

  // Safe asset
  let assetPath = TOTRANSFER.includes("container") // save image or transfer file
    ? path.join(__dirname, "hostpipe", "asset", "asset.tar")
    : path.join(__dirname, "asset", TOTRANSFER);

  prepareMigration();

  function prepareMigration() {
    console.log("Preparing asset migraton...");

    //const assetPath = '/hostpipe/asset/asset.tar';
    const dest = path.join(__dirname, "temp");
    bench("ENCRYPTION_START");
    encryptFile(assetPath, dest, assetKey)
      .then((options) => {
        bench("ENCRYPTION_STOP");
        console.log(`File encrypted: ${path.basename(options.src)}\n`);
        testament.iv = options.iv;
        testament.assetKey = assetKey;
        testament.assetFileExtension = options.fileExtension;

        // Split encrypted asset
        console.log(`Splitting encrypted asset...`);
        const file_enc_path = options.dest;
        bench("SPLIT_START");
        return splitFile.splitFile(file_enc_path, testamentors.length);
      })
      .catch((err) => {
        console.log("Error while encrypting asset: ", err);
      })
      .then((paths) => {
        bench("SPLIT_STOP");
        console.log(`Asset split in ${paths.length} parts.\n`);
        // Rename asset pieces
        testament.files = [];
        paths.forEach((src, i) => {
          const hashFunction = crypto.createHash("sha256");
          const filename = path.basename(src);

          // Rename file
          hashFunction.update(filename);
          const name_hash = hashFunction.digest("hex"); // 32 character Hash (sha256)
          testament.files.push(name_hash);
          fs.rename(
            src,
            path.join(__dirname, "temp", name_hash),
            async (err) => {
              if (err) throw err;
              client.post_assetPiece(testamentors[i].IP, port, name_hash);
            }
          );
        });
        // Safe Testament
        let dest_testament = path.join(__dirname, "temp", "testament.json");
        fs.writeFileSync(dest_testament, JSON.stringify(testament));
      })
      .catch((err) => {
        console.log("Error while renaming: ", err);
      })
      .then(async () => {
        console.log(`Created Testament: 
      NFTKey: ${testament.NFTKey}
      assetKey: ${testament.assetKey}
      iv: ${testament.iv}
      assetType: ${testament.assetFileExtension}
      assetPieces: ${testament.files}`);

        // Encrypt testament
        let testamentPath = path.join(__dirname, "temp", "testament.json");
        const encryption = await encryptFile(testamentPath, dest, testamentKey);
        shamirKeys = sss.split(testamentKey + "/" + encryption.iv, {
          shares: testamentors.length,
          threshold: testamentors.length / 2,
        }); // Threshhold = #testamentors / 2
        shamirKeys.forEach((key, i) => {
          client.post_shamirKey(testamentors[i].IP, port, key);
        });
      })
      .catch((err) => {
        console.log("Error while encrypting testament: ", err);
      })
      .then(() => {
        console.log("Encrypted Testament.\n");
        client.post_testament(inheritor.IP, port);
      })
      .catch((err) => {
        console.log("Error while sending Testament: ", err);
      });
  }

  // Helper Functions

  function getAllNodes(events) {
    let nodes = [];
    for (let event of events) {
      let currentNode = {};
      currentNode.address = event.returnValues.addr;
      currentNode.IP = event.returnValues.IP.trim();
      currentNode.resourceStatus = JSON.parse(event.returnValues.resources);
      nodes.push(currentNode);
    }
    return nodes;
  }

  function getRequirements(events) {
    const requrements = JSON.parse(events[0].returnValues.requirements);
    return requrements;
  }

  function getInheritor() {
    bench("IN-CHOOSE_START");
    console.log("Determining Inheritor...\n");
    let [inheritor_address, inheritor_IP] = migrationDecision(
      assetRequirements,
      allNodes,
      options.lrl.address
    );
    bench("IN-CHOOSE_STOP");
    inheritor.address = inheritor_address;
    inheritor.IP = inheritor_IP;
    console.log("\nInheritor: " + inheritor.address + ", IP: " + inheritor.IP);

    bench("IN_SET");
    contractInterface.setInheritor(contract, inheritor.address, options.lrl);
  }

  function getTestamentors() {
    console.log("Determining Testamentors...\n");
    for (let node of allNodes) {
      // !TEMPORARY SOLUTION for known 4-node network
      let address = node.address.toLocaleLowerCase();
      if (
        address != options.lrl.address &&
        address != inheritor.address.toLocaleLowerCase()
      ) {
        testamentors.push({
          address: address,
          IP: node.IP,
          alive: false,
        });
      }
    }

    testamentors.forEach((testamentor, i) => {
      console.log(
        `Testamentor ${i}: ${testamentor.address}, IP: ${testamentor.IP}\n`
      );
    });

    testamentors.forEach((testamentor) => {
      bench("TM-SET" + testamentor.address);
      contractInterface.setTestamentor(
        contract,
        testamentor.address,
        options.lrl
      );
    });
  }
};
