import express from "express";
import { Contract } from "../../dummy";
import { Resources } from "interface-types";
export const methodRouter = express.Router();
methodRouter.use(express.json());

export const contract = new Contract();

methodRouter.post("/methods/registerNode", (req, res) => {
  const IP = req.body.IP;
  const sender = req.body.sender;
  const resources: Resources = req.body.resources;
  console.log(`Received request: registerNode
  Body: ${JSON.stringify(req.body)}`);
  contract.methods
    .registerNode(
      IP,
      resources.CPU_pct,
      resources.clockrate_GHz,
      resources.RAM_GB,
      resources.BW_utilization,
      resources.RTT_ms,
      resources.cores,
      resources.BW
    )
    .send({ from: sender })
    .then((sender) => {
      res.status(201);
      res.send(sender);
    })
    .catch((err) => {
      console.error(err);
    });
});

methodRouter.post("/methods/registerAsset", (req, res) => {
  const body = req.body;
  const resources = body.resources;
  const owner = body.owner;
  console.log(`Received request: registerAsset
    Body: ${JSON.stringify(req.body)}`);
  contract.methods
    .registerAsset(
      owner,
      resources.CPU_pct,
      resources.clockrate_GHz,
      resources.RAM_GB,
      resources.BW_utilization,
      resources.RTT_ms,
      resources.cores,
      resources.BW
    )
    //TODO: Fix sender
    .send({ from: body.owner })
    .then(async (assetID: number) => {
      await contract.methods
        .setPassword(assetID, "")
        .send({ from: body.owner });
      res.status(201);
      res.send(`${assetID}`);
    })
    .catch((err) => {
      console.error(err);
    });
});

methodRouter.post("/methods/setInheritor", (req, res) => {
  const body = req.body;
  const assetID: number = body.assetID;
  const inheritor = body.inheritor;
  console.log(`Received request: setInheritor
  asset #${assetID}, inheritor: ${inheritor}`);
  contract.methods
    .setInheritor(assetID, inheritor)
    .send({ from: body.sender })
    .then(() => {
      res.status(201);
      res.send({ assetID, inheritor });
    })
    .catch((err) => {
      console.error("Error: " + err);
      res.status(400);
      res.send(err);
    });
});

methodRouter.post("/methods/setExecutor", (req, res) => {
  const body = req.body;
  const assetID = body.assetID;
  const executor = body.executor;
  console.log(`Received request: setExecutor
asset #${assetID}, executor: ${executor}`);
  contract.methods
    .setExecutor(assetID, executor)
    .send({ from: body.sender })
    .then(() => {
      res.status(201);
      res.send({ assetID, executor });
    })
    .catch((err) => {
      console.error("Error: " + err);
      res.status(400);
      res.send(err);
    });
});

methodRouter.post("/methods/setPassword", (req, res) => {
  const body = req.body;
  contract.methods
    .setPassword(body.assetID, body.password_hash)
    .send({ from: body.sender });
  res.send();
});

methodRouter.post("/methods/transferAsset", (req, res) => {
  const body = req.body;
  const assetID = body.assetID;
  const inheritor = body.inheritor;
  const password_hash = body.password_hash;
  console.log(`Received request: transferAsset #${assetID} to ${inheritor}`);
  contract.methods
    .transferAsset(assetID, inheritor, password_hash)
    .send({ from: body.sender })
    .then((inheritor: string) => {
      console.log(`Asset #${assetID} transfered to ${inheritor}`);
      res.status(201);
      res.send({ assetID, inheritor });
    })
    .catch((err) => {
      res.status(400);
      res.send(err);
    });
});
