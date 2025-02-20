import http from "http";
import Self from "../../../LRLNode";
import { ethers, Wallet } from "ethers";
import contractABI from "./LRLAsset.json";
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const provider = new ethers.JsonRpcProvider("http://172.20.0.1:8545/");
const PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const getSigner = async () => wallet;
let contract: ethers.Contract | null = null;
const initContract = async () => {
  try {
    if (contract) return contract;
    const signer = await getSigner();

    if (!signer) {
      throw new Error("signer is undefined. Check provider connection.");
    }

    console.log(" Using Signer:", signer.address);

    if (!contractABI.abi) {
      throw new Error(" Contract ABI is undefined. Check LRLAsset.json.");
    }

    contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);

    if (!contract) {
      throw new Error(" Contract initialization failed.");
    }

    console.log(" Contract initialized:", contract.address);

    return contract;
  } catch (error) {
    console.error(" Error initializing contract:", error);
    throw error;
  }
};

import {
  f_getPastEvents,
  f_registerAsset,
  f_registerNode,
  f_setExecutor,
  f_setInheritor,
  f_setPassword,
  e_once,
  e_subscribe,
  f_transferAsser,
  f_getAllNodes,
} from "../../../@types/contract_methods";
import { callbackStack } from "../../../@types/callbackStack";
import { callbackList } from "../../../@types/callbackList";
import {
  LRLNode,
  address,
  Options,
  EventCallback,
  PostOption,
  Resources,
  ContractEvent,
} from "interface-types";
const host = "dummycontract";
import { addSubscription, removeSubscription } from "../dummy/subscriptions";

const port = 8080;
const url = `http://${host}:${port}`;
initContract()
  .then((contract) => {
    console.log("Contract initialized:", contract);
  })
  .catch(console.error);

export let registerNode: f_registerNode = async function (node: LRLNode) {
  try {
    const contract = await initContract();

    if (!contract.registerNode) {
      throw new Error("registerNode function not found in the contract ABI");
    }
    const tx = await contract.registerNode(
      node.IP, // string memory IP
      node.resources.CPU_pct, // uint cpu_pct
      node.resources.clockrate_GHz, // uint clockrate_GHz
      node.resources.RAM_GB, // uint ram_GB
      node.resources.BW_utilization, // uint networkBandwidth_utilization
      node.resources.RTT_ms, // uint RTT_ms
      node.resources.cores, // uint cores
      node.resources.BW // uint networkBandwidth
    );

    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt.transactionHash);

    return receipt.transactionHash;
  } catch (error) {
    console.error("Error registering node:", error);
    throw error;
  }
};

export let registerAsset: f_registerAsset = async function (node: LRLNode) {
  try {
    const tx = await contract.registerAsset(
      node.address, // to (Node Owner)
      node.resources.CPU_pct, // CPU usage percentage
      node.resources.clockrate_GHz, // CPU Clock Rate
      node.resources.RAM_GB, // RAM size
      node.resources.BW_utilization, // Network Utilization
      node.resources.RTT_ms, // Round Trip Time
      node.resources.cores, // CPU Cores
      node.resources.BW // Network Bandwidth
    );

    console.log("Transaction sent, waiting for confirmation...", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);

    // assetID
    const assetID = receipt.events?.[0]?.args?.assetID;
    return assetID ? assetID.toString() : "";
  } catch (error) {
    console.error("Error registering asset:", error);
    throw error;
  }
};

export let setInheritor: f_setInheritor = async function (
  assetID: number,
  inheritor: address,
  self: LRLNode
): Promise<string> {
  try {
    const tx = await contract.setInheritor(assetID, inheritor);

    console.log("Transaction sent, waiting for confirmation...", tx.hash);
    const receipt = await tx.wait(); // Wait for transaction confirmation
    console.log("Transaction confirmed:", receipt);

    // Get the inheritor address from the event logs
    const event = receipt.events?.find((e) => e.event === "InheritorChosen");
    const newInheritor = event?.args?.inheritor;

    if (!newInheritor) {
      throw new Error("Failed to retrieve inheritor from event logs.");
    }

    console.log(
      `Successfully set Inheritor for asset #${assetID}: ${newInheritor}`
    );
    return newInheritor.toString();
  } catch (error) {
    console.error("Error setting inheritor:", error);
    throw error;
  }
};

export let setExecutor: f_setExecutor = async function (
  assetID: number,
  executor: address,
  self: LRLNode
): Promise<string> {
  try {
    const tx = await contract.setTestamentor(assetID, executor);

    console.log("Transaction sent, waiting for confirmation...", tx.hash);
    const receipt = await tx.wait(); // Wait for transaction confirmation
    console.log("Transaction confirmed:", receipt);

    // Get the executor address from the event logs
    const event = receipt.events?.find((e) => e.event === "TestamentorChosen");
    const newExecutor = event?.args?.testamentor;

    if (!newExecutor) {
      throw new Error("Failed to retrieve executor from event logs.");
    }

    console.log(
      `Successfully set Executor for asset #${assetID}: ${newExecutor}`
    );
    return newExecutor.toString();
  } catch (error) {
    console.error("Error setting executor:", error);
    throw error;
  }
};

export let setPassword: f_setPassword = function (
  assetID: number,
  password_hash: string,
  self: LRLNode
) {
  const request = http.request(
    new PostOption(host, "/Password", port),
    (res) => {
      res.on("error", (err) => {
        console.error("An Error occured:\n" + err.message);
      });
      res.on("end", () => {
        console.log("Password set.");
      });
    }
  );
  const postData = {
    assetID,
    password_hash,
    sender: self.address,
  };

  request.write(postData);
  request.end();
};

export let transferAsset: f_transferAsser = async function (
  assetID: number,
  inheritor: string,
  password_hash: string,
  self: LRLNode
): Promise<[number, string]> {
  try {
    const tx = await contract.transferAsset(assetID, inheritor, password_hash);

    console.log("Transaction sent, waiting for confirmation...", tx.hash);
    const receipt = await tx.wait(); // Wait for confirmation
    console.log("Transaction confirmed:", receipt);

    console.log(`Asset #${assetID} successfully transferred to: ${inheritor}`);
    return [assetID, inheritor];
  } catch (error) {
    console.error("Error transferring asset:", error);
    throw error;
  }
};

export let getPastEvents: f_getPastEvents = async function (
  event: string,
  options: Options
) {
  const filter = options.filter;
  return new Promise(async (resolve, reject) => {
    if (options.filter) {
      const filterRoute = Object.entries(filter).flat().join("/");
      console.log("Fetching past event at " + event + "/" + filterRoute);
      const res = await fetch(
        url + `/events/pastEvents/${event}/filter/${filterRoute}`
      );
      res
        .json()
        .then((data) => {
          resolve(data);
        })
        .catch((err) => {
          console.error(err);
        });
    } else {
      console.log("Fetching past event at " + event);
      const res = await fetch(url + `/events/pastEvents/${event}`);
      res
        .json()
        .then((data) => {
          resolve(data);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  });
};

export let once: e_once = function (
  event: string,
  options: Options,
  callback: EventCallback
) {
  fetch(url + "/events/once", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ event, filter: options?.filter }),
  })
    .then(async (res) => {
      const subID = global.parseInt(await res.text());
      console.log("Event subscribed: " + subID);
      addSubscription(subID, callback, true);
    })
    .catch((err) => console.error(err));
};

export let subscribe: e_subscribe = function (
  event: string,
  options: Options,
  callback: EventCallback
) {
  fetch(url + "/events/" + event, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event,
      filter: options?.filter,
    }),
  })
    .then(async (res) => {
      const subID = await res.json();
      console.log(`Add Subscription number: ${subID}`);
      addSubscription(Number(subID), callback, false);
    })
    .catch((err) => console.error(err));
};

export let getAllNodes: f_getAllNodes = async function (): Promise<string[]> {
  try {
    const res = await fetch(url + "/methods/getAllNodes", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch nodes: ${res.statusText}`);
    }

    const data = await res.json();
    return data.nodes; // Assuming the response structure contains { nodes: string[] }
  } catch (err) {
    throw new Error(`Error fetching nodes: ${err.message}`);
  }
};
