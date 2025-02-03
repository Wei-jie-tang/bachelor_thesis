const { deploy } = require("../../../smartcontract/deploy");
const { hash } = require("@/common/encryption.js");
const { bench } = require("@/common/benchmark/bench.js");
const { Contract } = require("web3");

/// Contract Methods ///
exports.deploy = deploy;

/**
 * Stores a nodes address and its available resources.
 * Emits a 'NewNode'-Event.
 * Will revert if node address already exists.
 * @param {Contract} contract web3-Smartcontract Object
 * @param {Object} options Must include Caller's `address`, `resources` and `IP`
 */
exports.registerNode = async (contract, options) => {
  let tx = { from: options.address, gas: 300000 };
  let [
    cpu_pct,
    clockrate_GHz,
    ram_GB,
    networkbandwidth_utilization,
    RTT_ms,
    cores,
    networkbandwidth,
  ] = [...Object.values(options.nodeResources)];
  bench("TX-REGISTERNODE_START");
  await contract.methods
    .registerNode(
      options.IP,
      cpu_pct,
      clockrate_GHz,
      ram_GB,
      networkbandwidth_utilization,
      RTT_ms,
      cores,
      networkbandwidth
    )
    .send(tx);
  bench("TX-REGISTERNODE_STOP");
};

/**
 * Mints a new Token to `localMachine` and maps it to `assetResources`.
 * Emits a 'Transfer'-Event.
 * Will revert if `localMachine` does not exist.
 * @param {Contract} contract web3-Smartcontract Object.
 * @param {String} localMachine Testator's address.
 * @param {Object} assetResources Asset requirements.
 * @param {Object} options Must include callers `address`.
 */
exports.registerAsset = async (
  contract,
  localMachine,
  assetResources,
  options
) => {
  let tx = { from: options.address };
  let [
    cpu_pct,
    clockrate_GHz,
    ram_GB,
    networkbandwidth_utilization,
    RTT_ms,
    cores,
    networkbandwidth,
  ] = [...Object.values(assetResources)];
  bench("TX-REGISTERASSET_START");
  await contract.methods
    .registerAsset(
      localMachine,
      cpu_pct,
      clockrate_GHz,
      ram_GB,
      networkbandwidth_utilization,
      RTT_ms,
      cores,
      networkbandwidth
    )
    .send(tx);
  bench("TX-REGISTERASSET_STOP");
};

/**
 * Maps `inheritor` to `options.assetID`.
 * Emits a 'InheritorChosen'-Event.
 * @param {Contract} contract web3-Smartcontract Object
 * @param {String} inheritor Inheritor's address
 * @param {Object} options Must include caller's `address` and `assetID`
 */
exports.setInheritor = async (contract, inheritor, options) => {
  console.log("\nBC: Setting Inheritor...\n");
  let tx = { from: options.address };
  try {
    bench("TX-SETINHERITOR_START");
    await contract.methods.setInheritor(options.assetID, inheritor).send(tx);
    bench("TX-SETINHERITOR_STOP");
  } catch (err) {
    console.error(`Error setting Testamentor: ${err.message}`);
  }
};

/**
 * Maps `testamentor` to `options.assetID`.
 * Emits a 'TestamentorChosen'-Event
 * @param {Contract} contract web3-Smartcontract Object
 * @param {String} testamentor Array of Testamentors
 * @param {Object} options Must include Caller's `address` and `assetID` as
 */
exports.setTestamentor = async (contract, testamentor, options) => {
  console.log("\nBC: Setting Testamentor...\n");
  let tx = { from: options.address };
  try {
    bench("TX-SETTM_START" + options.address);
    await contract.methods
      .setTestamentor(options.assetID, testamentor)
      .send(tx);
    bench("TX-SETTM_STOP" + options.address);
  } catch (err) {
    console.error(`Error setting Testamentor: ${err.message}`);
  }
};

/**
 * Sets a password to migrate the asset.
 * @param {Contract} contract web3-Smartcontract Object
 * @param {Int} assetID Token ID
 * @param {String} password Sha256 hash of the password
 * @param {Object} options Must include Caller's `address`
 */
exports.setPassword = async (contract, assetID, password, options) => {
  console.log("\nBC: Setting password...\n");
  let tx = { from: options.address };
  try {
    bench("TX-SETPW_START");
    await contract.methods.setPassword(assetID, password).send(tx);
    bench("TX-SETPW_STOP");
  } catch (err) {
    console.error(err);
  }
};

/**
 *
 * @param {Contract} contract web3-Smartcontract Object
 * @param {String} inheritor Inheritor's address
 * @param {String} password plaintext password
 * @param {Object} options Must include Caller's `address` and `assetId`
 */
exports.transferAsset = async (contract, inheritor, password, options) => {
  console.log("\nBC: Transferig asset...\n");
  let tx = { from: options.address };
  try {
    bench("TX-TRANSFERASSET_START");
    await contract.methods
      .transferAsset(options.assetID, inheritor, password)
      .send(tx);
    bench("TX-TRANSFERASSET_STOP");
  } catch (err) {
    console.error(err);
  }
};
