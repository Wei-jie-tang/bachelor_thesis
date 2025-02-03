import * as net from "node:net";
import * as fs from "fs";
// import Web3 from "web3";
import * as contractInterface from "./common/contract/interface";
import * as dummyInterface from "./common/contract/dummy/interface";
import localMachineWorkflow from "./dep_LocalMachine/localMachineWorkflow";
import inheritorWorkflow from "./dep_Inheritor/inheritorWorkflow";
import executorWorkflow from "./dep_Executor/executorWorkflow";

const SELF: LRLNode = {
  address: process.env.NODE_ADDRESS,
  IP: process.env.NODE_IP,
  resources: JSON.parse(
    fs.readFileSync(__dirname + "/resources.json").toString()
  )[process.env.NODE_ADDRESS],
};
console.log(`Node Address: ${SELF.address}`);

async function main() {
  dummyInterface.registerNode(SELF);
}

function subscribeEvents(contract) {
  contract.once(
    "NewAsset",
    { filter: { owner: SELF.address } },
    (error, event) => {
      if (error) console.error(error.message);
      handleNewAsset(event, contract, SELF);
    }
  );

  contract.once(
    "InheritorChosen",
    { filter: { addr: SELF.address } },
    (error, event) => {
      if (error) console.error(error.message);
      handleInheritorChosen(event, contract, SELF);
    }
  );

  contract.once(
    "TestamentorChosen",
    { filter: { addr: SELF.address } },
    (error, event) => {
      if (error) console.error(error.message);
      handleTestamentorsChosen(event, contract, SELF);
    }
  );
}

function handleNewAsset(event, contract, options) {
  // Callback for NewAsset Event
  const returnValues = { ...event.returnValues };

  const assetID = returnValues.ID;
  const assetOwner = returnValues.owner;

  console.log(`+++++++NEW ASSET+++++++\n
    Asset ID: ${assetID}\n
    Asset Owner: ${assetOwner}\n
    --------------------------------------------------------`);

  // Determine if node is asset's Owner
  if (options.address == assetOwner.toLocaleLowerCase()) {
    console.log(`This node is the Testator related to asset ${assetID}`);
    options.assetID = assetID;
    // start Local Machine Workflow
    try {
      localMachineWorkflow(contract, options);
    } catch (err) {
      console.log(err);
    }
  }
}

function handleInheritorChosen(event, contract, options) {
  // Callback for InheritorChosen Event
  console.log("\nInheritor chosen...\n");
  const returnValues = { ...event.returnValues };
  const assetID = returnValues.assetID;
  const inheritor = returnValues.addr.toLocaleLowerCase();
  console.log(`Inheritor for asset ${assetID} chosen: ${inheritor}`);

  if (options.address == inheritor) {
    console.log(`This node is the Inheritor of asset ${assetID}`);
    options.assetID = assetID;

    try {
      inheritorWorkflow(contract, options);
    } catch (err) {
      console.log(err);
    }
  }
}

function handleTestamentorsChosen(event, contract, options) {
  // Callback for TestamentorsChosen Event
  console.log("\nTestamentors chosen...\n");
  const returnValues = { ...event.returnValues };
  const assetID = returnValues.assetID;
  const testamentor = returnValues.addr.toLocaleLowerCase();
  console.log(`Testamentor for asset ${assetID} chosen: ${testamentor}`);

  if (testamentor == options.address) {
    console.log(`This node is a Testamentor of asset ${assetID}`);
    options.assetID = assetID;

    try {
      executorWorkflow(contract, options);
    } catch (err) {
      console.log(err);
    }
  }
}
