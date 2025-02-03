import { Contract } from "../src/dummy";
import crypto from "crypto";

let contract: Contract;
const standardRequirements = [11, 12, 13, 14, 15, 16, 16];
const standardRequirements_expected = JSON.stringify({
  cpu_pct: standardRequirements[0],
  clockrate_GHz: standardRequirements[1],
  ram_GB: standardRequirements[2],
  networkBandwidth_utilization: standardRequirements[3],
  RTT_ms: standardRequirements[4],
  cores: standardRequirements[5],
  networkBandwidth: standardRequirements[6],
});
const IP_1 = "10.5.0.11";
const address_1 = "0xfadd33cac99c8460461f4853853172f2afe91cdf";
const address_2 = "0xed25b35d8fac8ebba3a6919657a1554e4c6ef389";
const address_3 = "0x384ef54487099462042882283c05ca707e191490";
const address_4 = "0xd7dce576ec775956915cc690a0676480f974975f";
const address_5 = "0xcdb6e82baaf5ab342d94dae9fa0492c393b37694";
const IP_2 = "10.5.0.12";
const IP_3 = "10.5.0.13";
const IP_4 = "10.5.0.14";
const IP_5 = "10.5.0.15";
const tx_1 = { from: address_1, gas: 300000 };
const tx_2 = { from: address_2, gas: 300000 };
const tx_3 = { from: address_3, gas: 300000 };
const tx_4 = { from: address_4, gas: 300000 };
const tx_5 = { from: address_5, gas: 300000 };

const password_plain = "strongPassword";
const hash = crypto.createHash("sha256");
hash.update(password_plain);
const password_hash = hash.digest("hex");

describe("Dummy Smart Contract", function () {
  beforeEach(async () => {
    contract = new Contract();
    await contract.methods
      .registerNode(IP_1, ...standardRequirements)
      .send(tx_1);
    await contract.methods
      .registerNode(IP_2, ...standardRequirements)
      .send(tx_2);
  });

  describe("Public Object: methods", function () {
    describe("registerNode(IP, cpu_pct, clockrate_GHz, ram_GB, BW_pct, RTT_ms, cores, BW)", function () {
      it("rejects if addr is already registered", async () => {
        await expect(
          contract.methods
            .registerNode(IP_1, ...standardRequirements)
            .send(tx_1)
        ).rejects.toMatch("Node already registered");
      });
    });

    describe("registerAsset(to, cpu_pct, clockrate_GHz, ram_GB, BW_pct, RTT_ms, cores, BW)", function () {
      it("rejects if local Machine is not registered", async () => {
        await expect(
          contract.methods
            .registerAsset(address_3, ...standardRequirements)
            .send(tx_1)
        ).rejects.toMatch("not registered");
      });
      it("rejects if local Machine does not fulfill asset requirements", async () => {
        await contract.methods
          .registerNode(
            address_3,
            ...standardRequirements.map((element) => element - 1)
          )
          .send(tx_3);

        await expect(
          contract.methods
            .registerAsset(address_3, 12, 13, 14, 15, 16, 17, 18)
            .send(tx_1)
        ).rejects.toMatch("does not fulfill Asset requirements");
      });
    });

    describe("setInheritor(assetID, inheritor)", function () {
      it("rejects if assetID does not exist", async () => {
        await expect(
          contract.methods.setInheritor(1, address_1).send(tx_1)
        ).rejects.toMatch("Asset does not exist");
      });

      it("rejects if Inheritor is not registered", async () => {
        await contract.methods
          .registerAsset(address_1, ...standardRequirements)
          .send(tx_1);
        await expect(
          contract.methods.setInheritor(1, ...standardRequirements).send(tx_1)
        ).rejects.toMatch("Node not registered");
      });

      it("rejects if Inheritor does not fulfill asset's requirements", async () => {
        await contract.methods
          .registerNode(
            address_3,
            ...standardRequirements.map((element) => element - 1)
          )
          .send(tx_3);

        await contract.methods
          .registerAsset(address_1, ...standardRequirements)
          .send(tx_1);
        const assetID = 1;

        await expect(
          contract.methods.setInheritor(assetID, address_3).send(tx_1)
        ).rejects.toMatch("does not fulfill Asset requirements");
      });

      it("rejects if Inheritor = local Machine", async () => {
        const assetID = 1;
        await contract.methods
          .registerAsset(address_1, ...standardRequirements)
          .send(tx_1);

        await expect(
          contract.methods.setInheritor(assetID, address_1).send(tx_1)
        ).rejects.toMatch("local Machine cannot be Inheritor");
      });

      it("rejects if Inheritor is a Executor for this asset", async () => {
        await contract.methods
          .registerAsset(address_1, ...standardRequirements)
          .send(tx_1);
        const assetID = 1;
        await contract.methods.setExecutor(assetID, address_2).send(tx_1);

        await expect(
          contract.methods.setInheritor(assetID, address_2).send(tx_1)
        ).rejects.toMatch("Node is already a Executor");
      });

      it("rejects if Node is already the Inheritor", async () => {
        await contract.methods
          .registerAsset(address_1, ...standardRequirements)
          .send(tx_1);
        const assetID = 1;
        await contract.methods.setInheritor(assetID, address_2).send(tx_1);

        await expect(
          contract.methods.setInheritor(assetID, address_2).send(tx_1)
        ).rejects.toMatch("Node is already the Inheritor");
      });
    });

    describe("setExecutor(assetID, executor)", function () {
      it("rejects if assetID does not exist", async () => {
        await expect(
          contract.methods.setExecutor(1, address_2).send(tx_1)
        ).rejects.toMatch("Asset does not exist");
      });

      it("rejects if Executor is not registered", async () => {
        await contract.methods
          .registerAsset(address_1, ...standardRequirements)
          .send(tx_1);
        const assetID = 1;

        await expect(
          contract.methods.setExecutor(assetID, address_3).send(tx_1)
        ).rejects.toMatch("Node does not exist");
      });

      it("rejects if Executor = local Machine", async () => {
        await contract.methods
          .registerAsset(address_1, ...standardRequirements)
          .send(tx_1);
        const assetID = 1;

        await expect(
          contract.methods.setExecutor(assetID, address_1).send(tx_1)
        ).rejects.toMatch("Executor cannot be local Machine");
      });

      it("rejects if Node is already a Executor of the same Asset", async () => {
        await contract.methods
          .registerAsset(address_1, ...standardRequirements)
          .send(tx_1);
        const assetID = 1;
        await contract.methods.setExecutor(assetID, address_2).send(tx_1);

        await expect(
          contract.methods.setExecutor(assetID, address_2).send(tx_1)
        ).rejects.toMatch("Node is already a Executor");
      });
    });

    describe("transferAsset(assetID, to, password)", function () {
      it("rejects if Asset does not exist", async () => {
        await expect(
          contract.methods
            .transferAsset(1, address_1, password_plain)
            .send(tx_1)
        ).rejects.toMatch("Asset does not exist");
      });

      it("rejects if Inheritor does not exist", async () => {
        await contract.methods
          .registerAsset(address_1, ...standardRequirements)
          .send(tx_1);
        const assetID = 1;
        await contract.methods.setPassword(assetID, password_hash).send(tx_1);
        await expect(
          contract.methods
            .transferAsset(assetID, address_3, password_plain)
            .send(tx_1)
        ).rejects.toMatch("Node does not exist");
      });

      it("rejects if password is not correct", async () => {
        await contract.methods
          .registerAsset(address_1, ...standardRequirements)
          .send(tx_1);
        const assetID = 1;
        const inheritor = await contract.methods
          .setInheritor(assetID, address_2)
          .send(tx_1);

        await contract.methods.setPassword(assetID, password_hash).send(tx_1);

        await expect(
          contract.methods
            .transferAsset(assetID, inheritor, "wrongPassword")
            .send(tx_1)
        ).rejects.toMatch("Password incorrect");
      });

      it("rejects if new owner is not the Inheritor", async () => {
        await contract.methods
          .registerNode(IP_3, ...standardRequirements)
          .send(tx_3);
        await contract.methods
          .registerAsset(address_1, ...standardRequirements)
          .send(tx_1);
        const assetID = 1;
        await contract.methods.setInheritor(assetID, address_2).send(tx_1);
        await contract.methods.setPassword(assetID, password_hash).send(tx_1);

        await expect(
          contract.methods
            .transferAsset(assetID, address_3, password_plain)
            .send(tx_1)
        ).rejects.toMatch("Node is not the Inheritor");
      });
    });
  });

  describe("Event API", function () {
    describe("Public Method: getPastEvents(event[, options][, callback])", function () {
      describe("get 'NewNode'-Events", function () {
        it("returns an Array with all past 'NewNode' Events when no options.filter object is provided", async () => {
          const result = await contract.getPastEvents("NewNode");
          expect(result.length).toBe(2);
          expect(result[0].returnValues.addr).toBe(address_1);
          expect(result[1].returnValues.addr).toBe(address_2);
        });

        it("returns only 'NewNode' events matching the filtered IP", async () => {
          const result = await contract.getPastEvents("NewNode", {
            filter: {
              addr: address_1,
            },
          });

          expect(result.length).toBe(1);
          expect(result[0].returnValues.addr).toBe(address_1);
        });
      });

      describe("get 'NewAsset'-Events", function () {
        it("returns an Array with all past 'NewAsset' Events when no options.filter object is provided", async () => {
          const ID_expected = await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);

          const result = await contract.getPastEvents("NewAsset");
          expect(result.length).toBe(1);
          expect(result[0].returnValues.ID).toBe(ID_expected);
        });

        it("returns only 'NewAsset' events matching the filtered assetID", async () => {
          for (let c = 0; c < 3; c++) {
            await contract.methods
              .registerAsset(address_1, ...standardRequirements)
              .send(tx_1);
          }
          const assetID_expected = 2;
          const result = await contract.getPastEvents("NewAsset", {
            filter: {
              ID: assetID_expected,
            },
          });

          expect(result.length).toBe(1);
          expect(result[0].returnValues.ID).toBe(assetID_expected);
        });

        it("returns only 'NewAsset' events matching the filtered owner", async () => {
          await contract.methods
            .registerNode(IP_3, ...standardRequirements)
            .send(tx_3);
          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);
          await contract.methods
            .registerAsset(address_2, ...standardRequirements)
            .send(tx_2);
          await contract.methods
            .registerAsset(address_2, ...standardRequirements)
            .send(tx_3);
          await contract.methods
            .registerAsset(address_3, ...standardRequirements)
            .send(tx_3);

          const result = await contract.getPastEvents("NewAsset", {
            filter: {
              owner: address_2,
            },
          });

          expect(result.length).toBe(2);
          expect(result[0].returnValues.owner).toBe(address_2);
          expect(result[1].returnValues.owner).toBe(address_2);
        });
      });

      describe("get 'InheritorChosen'-Events", function () {
        it("returns an Array with all past 'InheritorChosen' Events when no options.filter object is provided", async () => {
          await contract.methods
            .registerNode(IP_3, ...standardRequirements)
            .send(tx_3);
          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);
          const assetID = 1;
          await contract.methods.setInheritor(assetID, address_2).send(tx_1);

          const result = await contract.getPastEvents("InheritorChosen");
          expect(result.length).toBe(1);
          expect(result[0].returnValues.inheritor).toBe(address_2);
        });

        it("returns only 'InheritorChosen' Events matching the filtered inheritor", async () => {
          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);
          await contract.methods.setInheritor(1, address_2).send(tx_1);

          await contract.methods
            .registerAsset(address_2, ...standardRequirements)
            .send(tx_2);
          await contract.methods.setInheritor(2, address_1).send(tx_2);

          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);
          await contract.methods.setInheritor(3, address_2).send(tx_1);
          /*
          Asset1:
            owner: address_1
            inheritor: address_2
          Asset2:
            owner: address_2
            inheritor: address_1
          Asset3:
            owner: address_1
            inheritor: address_2
          */

          const result = await contract.getPastEvents("InheritorChosen", {
            filter: {
              inheritor: address_1,
            },
          });

          expect(result.length).toBe(1);
          expect(result[0].returnValues.inheritor).toBe(address_1);
        });

        it("returns only 'InheritorChosen' Events matching the filtered assetID", async () => {
          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);
          await contract.methods.setInheritor(1, address_2).send(tx_1);

          await contract.methods
            .registerAsset(address_2, ...standardRequirements)
            .send(tx_2);
          await contract.methods.setInheritor(2, address_1).send(tx_2);

          await contract.methods
            .registerAsset(address_2, ...standardRequirements)
            .send(tx_2);
          await contract.methods.setInheritor(3, address_1).send(tx_2);
          /*
          Asset1:
            owner: address_1
            inheritor: address_2
          Asset2:
            owner: address_2
            inheritor: address_1
          Asset3:
            owner: address_2
            inheritor: address_1
          */
          const assetID_expected = 2;

          const result = await contract.getPastEvents("InheritorChosen", {
            filter: {
              assetID: assetID_expected,
            },
          });

          expect(result.length).toBe(1);
          expect(result[0].returnValues.assetID).toBe(assetID_expected);
          expect(result[0].returnValues.inheritor).toBe(address_1);
        });
      });

      describe("get 'ExecutorChosen'-Events", function () {
        it("returns an Array with all past 'ExecutorChosen' Events when no options.filter object is provided", async () => {
          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);
          await contract.methods
            .registerAsset(address_2, ...standardRequirements)
            .send(tx_2);
          await contract.methods.setExecutor(1, address_2).send(tx_1);
          await contract.methods.setExecutor(2, address_1).send(tx_2);

          const result = await contract.getPastEvents("ExecutorChosen");
          expect(result.length).toBe(2);
          expect(result[0].returnValues.executor).toBe(address_2);
          expect(result[1].returnValues.executor).toBe(address_1);
        });

        it("returns only 'ExecutorChosen' Events matching the filtered executor", async () => {
          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);
          await contract.methods.setExecutor(1, address_2).send(tx_1);

          await contract.methods
            .registerAsset(address_2, ...standardRequirements)
            .send(tx_2);
          await contract.methods.setExecutor(2, address_1).send(tx_2);

          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);
          await contract.methods.setExecutor(3, address_2).send(tx_1);
          /*
          Asset1:
            owner: address_1
            inheritor: address_2
          Asset2:
            owner: address_2
            inheritor: address_1
          Asset3:
            owner: address_1
            inheritor: address_2
          */

          const result = await contract.getPastEvents("ExecutorChosen", {
            filter: {
              executor: address_2,
            },
          });

          expect(result.length).toBe(2);
          expect(result[0].returnValues.executor).toBe(address_2);
          expect(result[1].returnValues.executor).toBe(address_2);
        });

        it("returns only 'ExecutorChosen' Events matching the filtered assetID", async () => {
          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);
          await contract.methods.setExecutor(1, address_2).send(tx_1);

          await contract.methods
            .registerAsset(address_2, ...standardRequirements)
            .send(tx_2);
          await contract.methods.setExecutor(2, address_1).send(tx_2);

          await contract.methods
            .registerAsset(address_2, ...standardRequirements)
            .send(tx_2);
          await contract.methods.setExecutor(3, address_1).send(tx_2);
          /*
          Asset1:
            owner: address_1
            inheritor: address_2
          Asset2:
            owner: address_2
            inheritor: address_1
          Asset3:
            owner: address_2
            inheritor: address_1
          */

          const result = await contract.getPastEvents("ExecutorChosen", {
            filter: {
              assetID: 2,
            },
          });

          expect(result.length).toBe(1);
          expect(result[0].returnValues.assetID).toBe(2);
          expect(result[0].returnValues.executor).toBe(address_1);
        });
      });
    });

    describe("Public Method: once(event[, options], callback", function () {
      let mockCallback: jest.Mock;
      beforeEach(() => {
        mockCallback = jest.fn();
      });

      describe("General", function () {
        it("Calls callback exactly once", async () => {
          const mockCallback2 = jest.fn();
          contract.once("NewAsset", undefined, mockCallback);
          contract.once(
            "NewAsset",
            { filter: { owner: address_2 } },
            mockCallback2
          );

          contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);
          contract.methods
            .registerAsset(address_2, ...standardRequirements)
            .send(tx_2);
          contract.methods
            .registerAsset(address_2, ...standardRequirements)
            .send(tx_2);

          expect(mockCallback.mock.calls).toHaveLength(1);
          expect(mockCallback2.mock.calls).toHaveLength(1);
        });
        it("Passes an 'undefined' as 'error'-parameter", async () => {
          contract.once("NewAsset", undefined, mockCallback);
          contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);

          expect(mockCallback.mock.calls[0][0]).not.toBeDefined();
        });
      });

      describe("Subscribe once to 'NewNode' event", function () {
        it("Passes 'IP' and 'resources' in 'returnValues' object.", async () => {
          contract.once("NewNode", {}, mockCallback);
          await contract.methods
            .registerNode(IP_3, ...standardRequirements)
            .send(tx_3);

          expect(mockCallback.mock.calls).toHaveLength(1);
          expect(mockCallback.mock.calls[0][1].returnValues.addr).toBe(
            address_3
          );
          expect(mockCallback.mock.calls[0][1].returnValues.resources).toBe(
            standardRequirements_expected
          );
        });
        it("Does not execute callback, if event does not match filtered IP", async () => {
          contract.once(
            "NewNode",
            {
              filter: {
                addr: address_4,
              },
            },
            mockCallback
          );

          await contract.methods
            .registerNode(IP_3, ...standardRequirements)
            .send(tx_3);

          expect(mockCallback.mock.calls).toHaveLength(0);
        });
        it("Calls callback, if event does match filtered addr", async () => {
          contract.once(
            "NewNode",
            {
              filter: {
                addr: address_3,
              },
            },
            mockCallback
          );

          await contract.methods
            .registerNode(IP_3, ...standardRequirements)
            .send(tx_3);

          expect(mockCallback.mock.calls).toHaveLength(1);
          expect(mockCallback.mock.calls[0][1].returnValues.addr).toBe(
            address_3
          );
          expect(mockCallback.mock.calls[0][1].returnValues.addr).toBe(
            address_3
          );
        });
      });

      describe("Subscribe once to 'NewAsset' event", function () {
        it("Passes 'ID', 'owner' and 'requirements' in 'returnValues' object.", async () => {
          contract.once("NewAsset", {}, mockCallback);

          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);

          expect(mockCallback.mock.calls).toHaveLength(1);
          expect(mockCallback.mock.calls[0][1].returnValues.ID).toBe(1);
          expect(mockCallback.mock.calls[0][1].returnValues.owner).toBe(
            address_1
          );
          expect(mockCallback.mock.calls[0][1].returnValues.requirements).toBe(
            standardRequirements_expected
          );
        });
        it("Does not execute callback, if event does not match filtered ID", async () => {
          contract.once(
            "NewAsset",
            {
              filter: {
                ID: 2,
              },
            },
            mockCallback
          );

          await contract.methods
            .registerAsset(address_2, ...standardRequirements)
            .send(tx_2);

          expect(mockCallback.mock.calls).toHaveLength(0);
        });
        it("Does not execute callback, if event does not match filtered owner", async () => {
          contract.once(
            "NewAsset",
            {
              filter: {
                owner: address_1,
              },
            },
            mockCallback
          );

          await contract.methods.registerAsset(
            address_2,
            ...standardRequirements
          );

          expect(mockCallback.mock.calls).toHaveLength(0);
        });
        it("Calls callback, if event does match filtered ID", async () => {
          contract.once(
            "NewAsset",
            {
              filter: {
                ID: 1,
              },
            },
            mockCallback
          );

          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);

          expect(mockCallback.mock.calls).toHaveLength(1);
          expect(mockCallback.mock.calls[0][1].returnValues.ID).toBe(1);
          expect(mockCallback.mock.calls[0][1].returnValues.owner).toBe(
            address_1
          );
        });
        it("Calls callback, if event does match filtered owner", async () => {
          contract.once(
            "NewAsset",
            {
              filter: {
                owner: address_1,
              },
            },
            mockCallback
          );

          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);

          expect(mockCallback.mock.calls).toHaveLength(1);
          expect(mockCallback.mock.calls[0][1].returnValues.ID).toBe(1);
          expect(mockCallback.mock.calls[0][1].returnValues.owner).toBe(
            address_1
          );
        });
      });

      describe("Subscribe once to 'InheritorChosen' event", function () {
        it("Passes 'inheritor' and 'assetID' in 'returnValues' object.", async () => {
          contract.once("InheritorChosen", {}, mockCallback);

          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);
          await contract.methods.setInheritor(1, address_2).send(tx_1);

          expect(mockCallback.mock.calls).toHaveLength(1);
          expect(mockCallback.mock.calls[0][1].returnValues.assetID).toBe(1);
          expect(mockCallback.mock.calls[0][1].returnValues.inheritor).toBe(
            address_2
          );
        });
        it("Does not execute callback, if event does not match filtered assetID", async () => {
          await contract.methods
            .registerAsset(address_2, ...standardRequirements)
            .send(tx_2);

          contract.once(
            "InheritorChosen",
            {
              filter: {
                assetID: 2,
              },
            },
            mockCallback
          );

          await contract.methods.setInheritor(1, address_1).send(tx_2);

          expect(mockCallback.mock.calls).toHaveLength(0);
        });
        it("Does not execute callback, if event does not match filtered inheritor", async () => {
          await contract.methods
            .registerAsset(address_2, ...standardRequirements)
            .send(tx_2);

          contract.once(
            "InheritorChosen",
            {
              filter: {
                inheritor: address_2,
              },
            },
            mockCallback
          );

          contract.methods.setInheritor(1, address_1).send(tx_2);

          expect(mockCallback.mock.calls).toHaveLength(0);
        });
        it("Calls callback, if event does match filtered assetID", async () => {
          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);

          contract.once(
            "InheritorChosen",
            {
              filter: {
                assetID: 1,
              },
            },
            mockCallback
          );

          await contract.methods.setInheritor(1, address_2).send(tx_1);

          expect(mockCallback.mock.calls).toHaveLength(1);
          expect(mockCallback.mock.calls[0][1].returnValues.assetID).toBe(1);
          expect(mockCallback.mock.calls[0][1].returnValues.inheritor).toBe(
            address_2
          );
        });
        it("Calls callback, if event does match filtered inheritor", async () => {
          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);

          contract.once(
            "InheritorChosen",
            {
              filter: {
                inheritor: address_2,
              },
            },
            mockCallback
          );

          contract.methods.setInheritor(1, address_2).send(tx_1);

          expect(mockCallback.mock.calls).toHaveLength(1);
          expect(mockCallback.mock.calls[0][1].returnValues.assetID).toBe(1);
          expect(mockCallback.mock.calls[0][1].returnValues.inheritor).toBe(
            address_2
          );
        });
      });

      describe("Subscribe once to 'ExecutorChosen' event", function () {
        it("Passes 'assetID' and 'executor' in 'returnValues' object.", async () => {
          contract.once("ExecutorChosen", {}, mockCallback);

          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);
          await contract.methods.setExecutor(1, address_2).send(tx_1);

          expect(mockCallback.mock.calls).toHaveLength(1);
          expect(mockCallback.mock.calls[0][1].returnValues.assetID).toBe(1);
          expect(mockCallback.mock.calls[0][1].returnValues.executor).toBe(
            address_2
          );
        });
        it("Does not execute callback, if event does not match filtered assetID", async () => {
          await contract.methods
            .registerAsset(address_2, ...standardRequirements)
            .send(tx_2);

          contract.once(
            "ExecutorChosen",
            {
              filter: {
                assetID: 2,
              },
            },
            mockCallback
          );

          await contract.methods.setExecutor(1, address_1).send(tx_2);

          expect(mockCallback.mock.calls).toHaveLength(0);
        });
        it("Does not execute callback, if event does not match filtered executor", async () => {
          await contract.methods
            .registerAsset(address_2, ...standardRequirements)
            .send(tx_2);

          contract.once(
            "ExecutorChosen",
            {
              filter: {
                executor: address_2,
              },
            },
            mockCallback
          );

          contract.methods.setExecutor(1, address_1).send(tx_2);

          expect(mockCallback.mock.calls).toHaveLength(0);
        });
        it("Calls callback, if event does match filtered assetID", async () => {
          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);

          contract.once(
            "ExecutorChosen",
            {
              filter: {
                assetID: 1,
              },
            },
            mockCallback
          );

          await contract.methods.setExecutor(1, address_2).send(tx_1);

          expect(mockCallback.mock.calls).toHaveLength(1);
          expect(mockCallback.mock.calls[0][1].returnValues.assetID).toBe(1);
          expect(mockCallback.mock.calls[0][1].returnValues.executor).toBe(
            address_2
          );
        });
        it("Calls callback, if event does match filtered executor", async () => {
          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);

          contract.once(
            "ExecutorChosen",
            {
              filter: {
                executor: address_2,
              },
            },
            mockCallback
          );

          contract.methods.setExecutor(1, address_2).send(tx_1);

          expect(mockCallback.mock.calls).toHaveLength(1);
          expect(mockCallback.mock.calls[0][1].returnValues.assetID).toBe(1);
          expect(mockCallback.mock.calls[0][1].returnValues.executor).toBe(
            address_2
          );
        });
      });
    });

    describe("Public 'events' Object", function () {
      let mockCB_NewNode;
      let mockCB_NewAsset;
      let mockCB_InheritorChosen;
      let mockCB_ExecutorChosen;

      beforeEach(() => {
        mockCB_NewNode = jest.fn();
        mockCB_NewAsset = jest.fn();
        mockCB_InheritorChosen = jest.fn();
        mockCB_ExecutorChosen = jest.fn();
      });
      describe("General", function () {
        beforeEach(() => {
          contract.events.NewNode(undefined, mockCB_NewNode);
          contract.events.NewAsset(undefined, mockCB_NewAsset);
          contract.events.InheritorChosen(undefined, mockCB_InheritorChosen);
          contract.events.ExecutorChosen(undefined, mockCB_ExecutorChosen);
        });

        it("Subscribes to an Event and calls the provided callback exactly once for each emission", async () => {
          await contract.methods
            .registerNode(IP_3, ...standardRequirements)
            .send(tx_3);
          await contract.methods
            .registerNode(IP_4, ...standardRequirements)
            .send(tx_4);
          await contract.methods
            .registerNode(IP_5, ...standardRequirements)
            .send(tx_5);
          const cbCalls_NewNode = mockCB_NewNode.mock.calls.length;

          expect(cbCalls_NewNode).toBe(3);

          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);
          await contract.methods
            .registerAsset(address_2, ...standardRequirements)
            .send(tx_2);
          await contract.methods
            .registerAsset(address_3, ...standardRequirements)
            .send(tx_3);
          await contract.methods
            .registerAsset(address_4, ...standardRequirements)
            .send(tx_4);
          const cbCalls_NewAsset = mockCB_NewAsset.mock.calls.length;

          expect(cbCalls_NewAsset).toBe(4);

          await contract.methods.setInheritor(1, address_2).send(tx_1);
          await contract.methods.setInheritor(2, address_3).send(tx_2);
          const cbCalls_InheritorChosen =
            mockCB_InheritorChosen.mock.calls.length;

          await contract.methods.setExecutor(3, address_4).send(tx_3);
          await contract.methods.setExecutor(4, address_5).send(tx_4);
          const cbCalls_ExecutorChosen =
            mockCB_ExecutorChosen.mock.calls.length;

          expect(cbCalls_ExecutorChosen).toBe(2);
        });
        it("Passes 'undefined' as 'error'-parameter", async () => {
          await contract.methods
            .registerNode(IP_3, ...standardRequirements)
            .send(tx_3);
          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_3);
          await contract.methods.setInheritor(1, address_2).send(tx_3);
          await contract.methods.setExecutor(1, address_3).send(tx_3);

          const cbParam_NewNode = mockCB_NewNode.mock.calls[0][0];
          const cbParam_NewAsset = mockCB_NewAsset.mock.calls[0][0];
          const cbParam_InheritorChosen =
            mockCB_InheritorChosen.mock.calls[0][0];
          const cbParam_ExecutorChosen = mockCB_ExecutorChosen.mock.calls[0][0];

          expect(cbParam_NewNode).not.toBeDefined();
          expect(cbParam_NewAsset).not.toBeDefined();
          expect(cbParam_InheritorChosen).not.toBeDefined();
          expect(cbParam_ExecutorChosen).not.toBeDefined();
        });
      });

      //TODO: Implement tests for Filters
      describe("'NewNode([options][,callback])' method", function () {
        it("Does not call callback, if event does not match filtered IP", async () => {
          contract.events.NewNode(
            {
              filter: {
                addr: address_4,
              },
            },
            mockCB_NewNode
          );
          await contract.methods
            .registerNode(IP_3, ...standardRequirements)
            .send(tx_3);

          const mockCB_calls = mockCB_NewNode.mock.calls.length;

          expect(mockCB_calls).toBe(0);
        });
        it("Calls the provided callback, if event matches filtered IP", async () => {
          contract.events.NewNode(
            {
              filter: {
                addr: address_3,
              },
            },
            mockCB_NewNode
          );
          await contract.methods
            .registerNode(IP_3, ...standardRequirements)
            .send(tx_3);

          const mockCB_calls = mockCB_NewNode.mock.calls.length;
          const mockCB_parameters = mockCB_NewNode.mock.calls[0][1];

          expect(mockCB_calls).toBe(1);
          expect(mockCB_parameters.returnValues.addr).toBe(address_3);
        });
      });
      describe("'NewAsset([options][,callback]' method", function () {
        it("Does not call callback, if event does not match filtered assetID", async () => {
          contract.events.NewAsset(
            {
              filter: {
                ID: 2,
              },
            },
            mockCB_NewAsset
          );
          await contract.methods
            .registerAsset(address_2, ...standardRequirements)
            .send(tx_2);

          const mockCB_calls = mockCB_NewAsset.mock.calls.length;
          expect(mockCB_calls).toBe(0);
        });
        it("Calls provided callback, if event matches filtered assetID", async () => {
          contract.events.NewAsset(
            {
              filter: {
                ID: 1,
              },
            },
            mockCB_NewAsset
          );
          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);

          const mockCB_Calls = mockCB_NewAsset.mock.calls.length;
          const mockCB_parameters = mockCB_NewAsset.mock.calls[0][1];

          expect(mockCB_Calls).toBe(1);
          expect(mockCB_parameters.returnValues.ID).toBe(1);
          expect(mockCB_parameters.returnValues.owner).toBe(address_1);
        });
        it("Does not call callback, if event does not match filtered owner", async () => {
          contract.events.NewAsset(
            {
              filter: {
                owner: address_4,
              },
            },
            mockCB_NewAsset
          );
          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);

          const mockCB_calls = mockCB_NewAsset.mock.calls.length;

          expect(mockCB_calls).toBe(0);
        });
        it("Calls provided callback, if event matches filtered owner", async () => {
          contract.events.NewAsset(
            {
              filter: {
                owner: address_1,
              },
            },
            mockCB_NewAsset
          );
          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);
          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);

          const mockCB_calls = mockCB_NewAsset.mock.calls.length;
          const mockCB_parameters1 = mockCB_NewAsset.mock.calls[0][1];
          const mockCB_parameters2 = mockCB_NewAsset.mock.calls[1][1];

          expect(mockCB_calls).toBe(2);
          expect(mockCB_parameters1.returnValues.ID).toBe(1);
          expect(mockCB_parameters1.returnValues.owner).toBe(address_1);
          expect(mockCB_parameters2.returnValues.ID).toBe(2);
          expect(mockCB_parameters2.returnValues.owner).toBe(address_1);
        });
      });
      describe("'InheritorChosen([options][,callback]' method", function () {
        it("Does not execute callback, if event does not match filtered assetID", async () => {
          await contract.methods
            .registerAsset(address_2, ...standardRequirements)
            .send(tx_2);

          contract.events.InheritorChosen(
            {
              filter: {
                assetID: 2,
              },
            },
            mockCB_InheritorChosen
          );

          await contract.methods.setInheritor(1, address_1).send(tx_2);

          expect(mockCB_InheritorChosen.mock.calls).toHaveLength(0);
        });
        it("Does not execute callback, if event does not match filtered inheritor", async () => {
          await contract.methods
            .registerAsset(address_2, ...standardRequirements)
            .send(tx_2);

          contract.events.InheritorChosen(
            {
              filter: {
                inheritor: address_2,
              },
            },
            mockCB_InheritorChosen
          );

          contract.methods.setInheritor(1, address_1).send(tx_2);

          expect(mockCB_InheritorChosen.mock.calls).toHaveLength(0);
        });
        it("Calls callback, if event does match filtered assetID", async () => {
          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);

          contract.events.InheritorChosen(
            {
              filter: {
                assetID: 1,
              },
            },
            mockCB_InheritorChosen
          );

          await contract.methods.setInheritor(1, address_2).send(tx_1);

          expect(mockCB_InheritorChosen.mock.calls).toHaveLength(1);
          expect(
            mockCB_InheritorChosen.mock.calls[0][1].returnValues.assetID
          ).toBe(1);
          expect(
            mockCB_InheritorChosen.mock.calls[0][1].returnValues.inheritor
          ).toBe(address_2);
        });
        it("Calls callback, if event does match filtered inheritor", async () => {
          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);

          contract.events.InheritorChosen(
            {
              filter: {
                inheritor: address_2,
              },
            },
            mockCB_InheritorChosen
          );

          contract.methods.setInheritor(1, address_2).send(tx_1);

          expect(mockCB_InheritorChosen.mock.calls).toHaveLength(1);
          expect(
            mockCB_InheritorChosen.mock.calls[0][1].returnValues.assetID
          ).toBe(1);
          expect(
            mockCB_InheritorChosen.mock.calls[0][1].returnValues.inheritor
          ).toBe(address_2);
        });
      });
      describe("'ExecutorChosen([options][,callback]' method", function () {
        it("Does not execute callback, if event does not match filtered assetID", async () => {
          await contract.methods
            .registerAsset(address_2, ...standardRequirements)
            .send(tx_2);

          contract.events.ExecutorChosen(
            {
              filter: {
                assetID: 2,
              },
            },
            mockCB_ExecutorChosen
          );

          await contract.methods.setExecutor(1, address_1).send(tx_2);

          expect(mockCB_ExecutorChosen.mock.calls).toHaveLength(0);
        });
        it("Does not execute callback, if event does not match filtered executor", async () => {
          await contract.methods
            .registerAsset(address_2, ...standardRequirements)
            .send(tx_2);

          contract.events.ExecutorChosen(
            {
              filter: {
                executor: address_2,
              },
            },
            mockCB_ExecutorChosen
          );

          contract.methods.setExecutor(1, address_1).send(tx_2);

          expect(mockCB_ExecutorChosen.mock.calls).toHaveLength(0);
        });
        it("Calls callback, if event does match filtered assetID", async () => {
          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);

          contract.events.ExecutorChosen(
            {
              filter: {
                assetID: 1,
              },
            },
            mockCB_ExecutorChosen
          );

          await contract.methods.setExecutor(1, address_2).send(tx_1);

          expect(mockCB_ExecutorChosen.mock.calls).toHaveLength(1);
          expect(
            mockCB_ExecutorChosen.mock.calls[0][1].returnValues.assetID
          ).toBe(1);
          expect(
            mockCB_ExecutorChosen.mock.calls[0][1].returnValues.executor
          ).toBe(address_2);
        });
        it("Calls callback, if event does match filtered executor", async () => {
          await contract.methods
            .registerAsset(address_1, ...standardRequirements)
            .send(tx_1);

          contract.events.ExecutorChosen(
            {
              filter: {
                executor: address_2,
              },
            },
            mockCB_ExecutorChosen
          );

          contract.methods.setExecutor(1, address_2).send(tx_1);

          expect(mockCB_ExecutorChosen.mock.calls).toHaveLength(1);
          expect(
            mockCB_ExecutorChosen.mock.calls[0][1].returnValues.assetID
          ).toBe(1);
          expect(
            mockCB_ExecutorChosen.mock.calls[0][1].returnValues.executor
          ).toBe(address_2);
        });
      });
    });
  });
});
