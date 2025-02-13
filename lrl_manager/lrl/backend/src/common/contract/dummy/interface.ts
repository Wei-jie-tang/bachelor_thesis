import http from "http";
import Self from "../../../LRLNode";

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
import { addSubscription, removeSubscription } from "./subscriptions";

const port = 8080;
const url = `http://${host}:${port}`;
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

export let registerNode: f_registerNode = async function (node: LRLNode) {
  const postData = JSON.stringify({
    sender: node.addr,
    IP: node.IP,
    resources: node.resources,
  });

  return new Promise<string>((resolve, reject) => {
    fetch(url + "/methods/registerNode", {
      method: "POST",
      body: postData,
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        if (res.status === 201) {
          const address = await res.text();
          console.log(`Successfully registered Node: ${address}`);
          Self.status.update("pending");
          resolve(address);
        }
      })
      .catch((err) => console.log(err));
  });
};

export let registerAsset: f_registerAsset = async function (node: LRLNode) {
  const postData = JSON.stringify({
    resources: node.resources,
    owner: node.address,
  });

  return new Promise<string>((resolve, reject) => {
    fetch(url + "/methods/registerAsset", {
      method: "POST",
      body: postData,
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        if (res.status === 201) {
          const assetID = await res.text();
          resolve(`${assetID}`);
        }
      })
      .catch((err) => console.log(err));
  });
};

export let setInheritor: f_setInheritor = async function (
  assetID: number,
  inheritor: address,
  self: LRLNode
): Promise<string> {
  const postData = JSON.stringify({
    assetID,
    inheritor,
    sender: self.address,
  });

  // resolves with Inheritor address
  return new Promise<string>((resolve, reject) => {
    fetch(url + "/methods/setInheritor", {
      method: "POST",
      body: postData,
      headers: {
        "Content-Type": "application/json",
      },
    }).then(async (res) => {
      if (res.status === 201) {
        const data = await res.json();
        const assetID = data.assetID;
        const inheritor = data.inheritor;
        console.log(
          `Successfully set Inheritor for asset #${assetID}: ${inheritor}`
        );
        resolve(inheritor);
      } else {
        const error = await res.text();
        reject(error);
      }
    });
  });
};

export let setExecutor: f_setExecutor = async function (
  assetID: number,
  executor: address,
  self: LRLNode
): Promise<string> {
  const postData = JSON.stringify({
    assetID,
    executor,
    sender: self.address,
  });

  // resovles with executor address
  return new Promise<string>((resolve, reject) => {
    fetch(url + "/methods/setExecutor", {
      method: "POST",
      body: postData,
      headers: {
        "Content-Type": "application/json",
      },
    }).then(async (res) => {
      if (res.status === 201) {
        const data = await res.json();
        const assetID = data.assetID;
        const executor = data.executor;
        console.log(
          `Successfully set Executor for asset #${assetID}: ${executor}`
        );
        resolve(executor);
      } else {
        const error = await res.text();
        reject(error);
      }
    });
  });
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
) {
  const postData = JSON.stringify({
    assetID,
    inheritor,
    password_hash,
    sender: self.address,
  });

  return new Promise<[assetID: number, inheritor: string]>(
    (resolve, reject) => {
      fetch(url + "/methods/transferAsset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: postData,
      }).then(async (res) => {
        if (res.status === 201) {
          const data = await res.json();
          const assetID = data.assetID;
          const inheritor = data.inheritor;
          resolve([assetID, inheritor]);
        } else {
          const error = await res.text();
          reject(error);
        }
      });
    }
  );
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
