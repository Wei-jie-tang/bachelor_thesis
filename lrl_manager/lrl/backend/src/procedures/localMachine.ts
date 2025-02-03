import path from "path";
import * as contractInterface from "../common/contract/dummy/interface";
import Self from "../LRLNode.js";
import { Resources, ContractEvent } from "interface-types";
import { TOPSIS } from "./topsis";
import { map } from "lodash";

export async function chooseExecutors(assetID: number, numExecutors: number) {
  // Find owner
  const assetEvent: ContractEvent = (
    await contractInterface.getPastEvents("NewAsset", {
      filter: { ID: assetID },
    })
  ).events[0];

  const owner: string = assetEvent.returnValues.owner;
  // Find inheritor
  const inheritorEvents: ContractEvent[] = (
    await contractInterface.getPastEvents("InheritorChosen", {
      filter: { assetID },
    })
  ).events;

  const inheritors: string[] = inheritorEvents.map((event) => {
    return event.returnValues.inheritor;
  });

  return new Promise<string[]>((resolve, reject) => {
    contractInterface
      .getPastEvents("NewNode", {})
      .then((events) => {
        // console.log(`Choose Executors: ${JSON.stringify(events)}`);

        const executors = [];
        const validNodes = events.events
          .map((event) => {
            return event.returnValues.addr;
          })
          .filter((addr) => {
            return owner !== addr && !inheritors.includes(addr);
          });

        if (validNodes.length < numExecutors) {
          reject(
            new Error(
              `Not enough valid Executors: ${validNodes.length}. Expected: ${numExecutors}`
            )
          );
        }

        while (executors.length < numExecutors) {
          const index = Math.floor(validNodes.length * Math.random());

          const chosen = validNodes[index];

          if (executors.includes(chosen)) continue;

          executors.push(chosen);
        }

        resolve(executors);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

const BENEFITS: { [resource: string]: 1 | -1 } = {
  CPU_pct: -1,
  cores: 1,
  clockrate_GHz: 1,
  BW: 1,
  BW_utilization: -1,
  RAM_GB: 1,
  RTT_ms: -1,
};

/**
 * Find best Inheritor candidates among all registered nodes
 * @param assetID assetID
 * @param weights Optional array of weights for TOPSIS. NOTE: SUM(weights) = 1
 * @returns Array of Inheritor candidates, sorted by decending relative closeness to ideal candidate
 */
export async function chooseInheritor(
  assetID: number,
  weights?: { [resource: string]: number }
) {
  const topsis = new TOPSIS({
    CPU_pct: -1,
    cores: 1,
    clockrate_GHz: 1,
    BW: 1,
    BW_utilization: -1,
    RAM_GB: 1,
    RTT_ms: -1,
  });

  return new Promise<string>(async (resolve, reject) => {
    const assetEvent = (
      await contractInterface.getPastEvents("NewAsset", {
        filter: { assetID },
      })
    ).events[0];

    const owner = assetEvent.returnValues.owner;
    const requirements = assetEvent.returnValues.requirements;

    const candidates = await inheritorCandidates(assetID, owner);

    try {
      candidates.forEach((candidate) => {
        topsis.addCandidate(candidate.addr, candidate.resources);
      });

      if (weights) topsis.addWeights(weights);

      const ranking = topsis.getRanking(requirements);
      const candidates_ranked = candidates.map((candidate) => candidate.addr);
      candidates_ranked.sort((a, b) => {
        return ranking[b] - ranking[a];
      });

      if (
        candidates_ranked.length === 0 ||
        !fulfillsRequirement(candidates_ranked[0], requirements)
      ) {
        reject("No suitable Inheritor found.");
      } else {
        console.log(`Inheritor chosen: ${candidates_ranked[0]}`);
        resolve(candidates_ranked[0]);
      }
    } catch (err) {
      reject(err);
    }
  });
}
///
// CPU_pct | cores | Clockrate | Bandwidth | Bandwidth_util | RAM | RTT

export async function inheritorCandidates(
  assetID: number,
  owner: string
): Promise<{ addr: string; resources: { [resource: string]: number } }[]> {
  return new Promise(async (resolve, reject) => {
    const allNodeEvents: ContractEvent[] = (
      await contractInterface.getPastEvents("NewNode", {})
    ).events;

    const executorEvents = await contractInterface.getPastEvents(
      "ExecutorChosen",
      {
        filter: {
          assetID,
        },
      }
    );
    console.log(
      `executorEvents: ${typeof executorEvents}: ${JSON.stringify(executorEvents)}`
    );
    const executorAddresses = executorEvents.events.map((event) => {
      return event.returnValues.executor;
    });

    const candidateEvents = allNodeEvents.filter((event) => {
      const candidateAddress = event.returnValues.addr;
      // Not owner
      if (candidateAddress === owner) return false;

      // Not executor
      if (executorAddresses.includes(candidateAddress)) return false;

      return true;
    });

    const candidates: {
      addr: string;
      resources: { [resource: string]: number };
    }[] = candidateEvents.map((event) => {
      return {
        addr: event.returnValues.addr,
        resources: JSON.parse(event.returnValues.resources),
      };
    });
    resolve(candidates);
  });
}

function fulfillsRequirement(candidate: string, requirements: Resources) {
  return new Promise(async (resolve, reject) => {
    let resources = await contractInterface.getPastEvents("NewNode", {
      filter: { addr: candidate },
    });
    if (resources.events.length === 0) {
      reject("No Node event found.");
    } else {
      resources = resources.events[0].returnValues.resources;

      // FALSE if:
      // Benefit > 0: resource < requirement
      // Benefit < 0: resource > requirement
      Object.keys(resources).forEach((key) => {
        if (BENEFITS[key] * (resources[key] - requirements[key]) < 0)
          resolve(false);
      });
      resolve(true);
    }
  });
}

export function startHeartbeat(executorIP: string) {
  const privateKey = path.join();
  const heartbeatInterval = setInterval(() => {
    const timestamp = Date.now().toString();
  }, 500);
}
