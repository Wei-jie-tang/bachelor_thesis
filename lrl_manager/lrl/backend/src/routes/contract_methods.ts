/// User Input routes ///
import express, { Router } from "express";
import path from "path";
import * as contractInterface from "../common/contract/dummy/interface";
import Self from "../LRLNode";
import { Asset } from "../Asset";
import {
  exchangeECDHKeys,
  decryptSessionTokens,
  encryptSessionTokens,
} from "../procedures/session_token";
import { generateECDHKeyPair } from "../common/cryptography/encrypt_ecdh";
import { loadECDHKeys, saveECDHKeys } from "../procedures/ecdh_key";
import {
  D_ASSET,
  D_TMP,
  STATUS_INTERNAL_SERVER_ERROR,
  STATUS_NO_CONTENT,
  STATUS_OK,
} from "../common/constants";
import { Resources } from "interface-types";
const os = require("os");
import axios from "axios";

import {
  chooseExecutors,
  chooseInheritor,
  startHeartbeat,
} from "../procedures/localMachine";

const router: Router = express.Router();

router.use(express.json());
router.post("/methods/registerNode", async (req, res) => {
  console.log("Received request: registerNode");
  //startKademlia();
  let IP = req.body.IP || "";
  if (!IP) {
    // Attempt to get the system's IP address if it's missing from the body
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
      const interfaceInfo = networkInterfaces[interfaceName];
      for (const info of interfaceInfo) {
        if (info.family === "IPv4" && !info.internal) {
          IP = info.address; // Get the first available external IPv4 address
          break;
        }
      }
      if (IP) break; // If an IP is found, break the loop
    }
  }
  if (!IP) {
    return res
      .status(400)
      .json({ error: "IP is required and could not be determined." });
  }
  const addr = req.body.address;
  const resources = {
    CPU_pct: 100,
    cores: parseInt(req.body.cores),
    clockrate_GHz: parseFloat(req.body.speed),
    RAM_GB: parseFloat(req.body.ram),
    BW_utilization: 0,
    RTT_ms: parseInt(req.body.rtt),
    BW: parseInt(req.body.bandwidth),
  };
  //TODO: Add back when integrating real contract

  // contractInterface.subscribe(
  // "NewNode",
  // {
  // filter: {
  // addr: Self.addr,
  // },
  // },
  // () => {
  // Self.status.update("registered");
  // console.log(
  // Node Status updated: ${Self.status.get()}\nAddress: ${Self.addr}
  // );
  // }
  // );
  //  await axios.post("http://localhost:5001/store", {
  //  key: addr,
  //value: JSON.stringify(resources),
  //  });

  try {
    await axios
      .post("http://172.20.0.1:5002/register", {
        ip: IP,
      })
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
    await axios.post("http://172.20.0.1:5002/store", {
      key: addr,
      value: IP,
    });
    const { privateKey, publicKey } = generateECDHKeyPair();
    let storedKeys = loadECDHKeys();
    storedKeys[addr] = {
      publicKey: publicKey.toString("hex"),
      privateKey: privateKey.toString("hex"),
    };
    saveECDHKeys(storedKeys);

    // 🔹 Register Node using the real smart contract
    contractInterface.registerNode({
      IP,
      addr,
      resources,
    });

    // 🔹 Send response with transaction hash
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/methods/registerAsset", async (req, res, next) => {
  console.log(`Received request: registerAsset`);
  const IP = "";
  const address = req.body.owner;
  const resources = {
    CPU_pct: 100,
    cores: parseInt(req.body.cores),
    clockrate_GHz: parseFloat(req.body.speed),
    BW: parseInt(req.body.bandwidth),
    BW_utilization: 0,
    RAM_GB: parseFloat(req.body.ram),
    RTT_ms: parseInt(req.body.rtt),
  };
  const numExecutors = parseInt(req.body.numExecutors);
  const threshold = parseInt(req.body.threshold);
  console.log(`Address: ${address}\n Resrouces: ${JSON.stringify(resources)}`);

  contractInterface.once(
    "NewAsset",
    { filter: { owner: address } },
    async (err, event) => {
      const assetID = event.returnValues.ID;
      console.log(`Successfully registered asset: ${assetID}`);
      let executors: string[];
      let inheritor: string;

      /// CHOOSE INHERITOR (topsis)
      try {
        inheritor = await chooseInheritor(assetID);
        console.log(`Inheritor chosen: \n${inheritor}`);
        await contractInterface.setInheritor(assetID, inheritor, Self);
      } catch (err) {
        console.log("Error choosing Inheritor: " + err);
        res.status(STATUS_INTERNAL_SERVER_ERROR);
        res.send(err);
      }

      /// CHOOSE EXECUTORS (random)
      try {
        executors = await chooseExecutors(assetID, numExecutors);
        console.log(`Executors chosen: `);
        for (const executor of executors) {
          console.log(executor);
          await contractInterface.setExecutor(assetID, executor, Self);
        }
      } catch (err) {
        console.log("Error choosing Executors: " + err);
        res.status(STATUS_INTERNAL_SERVER_ERROR);
        res.send(err);
      }
      const testator = req.body.owner; // The owner is the testator

      const { ecdhKeys, distributedPublicKeys } = await exchangeECDHKeys(
        testator,
        executors,
        inheritor
      );
      const encryptSessionToken = encryptSessionTokens(
        testator,
        executors,
        inheritor,
        ecdhKeys
      );
      //console.log("Encrypted tokens:", encryptSessionToken);
      const decryptSessionToken = decryptSessionTokens(
        executors,
        inheritor,
        encryptSessionToken,
        distributedPublicKeys,
        ecdhKeys
      );

      /// MAIN ASSET PREPARATION ///

      let asset_enc = new Asset(
        assetID,
        path.join(D_ASSET, "asset.jpg"),
        resources,
        executors
      ).encryptAsset(path.join(D_TMP));

      await asset_enc.splitAsset(numExecutors);

      asset_enc
        .sendFragments(executors)
        .createTestament(path.join(D_TMP))
        .encryptTestament(path.join(D_TMP))
        .sendTestament(inheritor)
        .splitKey(numExecutors, threshold, path.join(D_TMP, "shamir"))
        .sendKeyFragments(executors);

      console.log(`-----Successfully prepared asset #${assetID}-----`);
      res.status(STATUS_NO_CONTENT);
      res.send();
    }
  );

  contractInterface.registerAsset({ IP, address, resources });
});

router.post("/methods/setInheritor", (req, res, next) => {
  console.log(`Received request: setInheritor`);
  const assetID = req.body.assetID;
  const inheritor = req.body.inheritor;
  contractInterface
    .setInheritor(assetID, inheritor, Self)
    .then((inheritor: string) => {
      res.status(STATUS_NO_CONTENT);
      res.send();
    })
    .catch((err) => {
      console.log("Error: " + err);
    });
});

//TODO: Send asset pieces to executors
router.post("/methods/setExecutor", (req, res, next) => {
  console.log(`Received request: setExecutor`);
  const assetID = req.body.assetID;
  const executor = req.body.executor;
  contractInterface
    .setExecutor(assetID, executor, Self)
    .then((executor: string) => {
      res.status(STATUS_NO_CONTENT);
      res.send();
    })
    .catch((err) => {
      console.log("Error: " + err);
    });
});

router.post("/methods/setPassword", (req, res, next) => {
  console.log("NOT IMPLEMENTED: setPassword");
});

//TODO: Transfer asset pieces
router.post("/methods/transferAsset", (req, res, next) => {
  console.log(`Received Request: transferAsset`);
  const assetID = req.body.assetID;
  const inheritor = req.body.inheritor;
  const password_hash = req.body.password_hash;

  contractInterface
    .transferAsset(assetID, inheritor, password_hash, Self)
    .then((assetID: number, inheritor: string) => {
      console.log(`Successfully transfered asset #${assetID} to ${inheritor}`);
      res.status(STATUS_NO_CONTENT);
      res.send();
    })
    .catch((err) => {
      console.error("Error transfering asset: " + err);
    });
});

router.get("/events/pastEvents/:event", (req, res) => {
  const event = req.params.event;
  console.log(`Received past events request: ${event}`);
  contractInterface
    .getPastEvents(event, {})
    .then((events) => {
      res.status(STATUS_OK);
      res.json(events);
    })
    .catch((err) => {
      console.log(`Error: ${err.message}`);
      res.status(STATUS_INTERNAL_SERVER_ERROR);
      res.send(err.message);
    });
});

router.get("/events/pastEvents/:event/*", (req, res) => {
  const filterParams = req.params[0].split("/").slice(1);
  const event = req.params.event;
  console.log(
    `Received past events request: ${event}\nFilter: ${filterParams}`
  );
  const filter = {};
  while (filterParams.length > 0) {
    filter[filterParams.shift()] = filterParams.shift();
  }
  contractInterface
    .getPastEvents(event, { filter })
    .then((events) => {
      res.status(STATUS_OK);
      res.json(events);
    })
    .catch((err) => {
      console.log(`Error: ${err.message}`);
      res.status(STATUS_INTERNAL_SERVER_ERROR);
      res.send(err.message);
    });
});
// router.post("/events/subscribe/:event", (req, res, next) => {
// const event = req.params.event;
// const filter = req.body.filter;
// contractInterface.subscribe(event, { filter }, () => {
// console.log(`Event caught: ${event}`);
// });
// });
// router.get("/events/once/:event", (req, res, next) => {
// res.send("NOT IMPLEMENTED: once");
// });
export default router;
