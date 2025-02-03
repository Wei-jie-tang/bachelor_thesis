import crypto from "crypto";
import events from "events";
import {
  address,
  IP,
  TX_Object,
  Options,
  ContractEvent,
  NewNode,
  NewAsset,
  InheritorChosen,
  ExecutorChosen,
  Transfer,
} from "interface-types";

const eventEmitter = new events.EventEmitter();

export class Contract {
  private _currentId: number;
  private _allNodes: string[];
  private _resources: Map<string, object>;
  private _requirements: Map<number, object>;
  private _ownerOf: Map<number, string>;
  private _inheritor: Map<number, string>;
  private _executors: Map<number, string[]>;
  private _password: Map<number, string>;

  public methods: {
    registerNode: Function;
    registerAsset: Function;
    setExecutor: Function;
    setInheritor: Function;
    setPassword: Function;
    transferAsset: Function;
    transferToOriginalOwner: Function;
  };

  constructor() {
    this._pastEvents = [];

    this.methods = {
      registerNode: (...args) => {
        return this.registerNode.apply(this, args);
      },
      registerAsset: (...args) => {
        return this.registerAsset.apply(this, args);
      },
      setExecutor: (...args) => {
        return this.setExecutor.apply(this, args);
      },
      setInheritor: (...args) => {
        return this.setInheritor.apply(this, args);
      },
      setPassword: (...args) => {
        return this.setPassword.apply(this, args);
      },
      transferAsset: (...args) => {
        return this.transferAsset.apply(this, args);
      },
      transferToOriginalOwner: (...args) => {
        return this.transferToOriginalOwner.apply(this, args);
      },
    };

    this._currentId = 0;
    this._allNodes = [];
    this._resources = new Map<string, object>();
    this._requirements = new Map<number, object>();
    this._ownerOf = new Map<number, string>();
    this._inheritor = new Map<number, string>();
    this._executors = new Map<number, string[]>();
    this._password = new Map<number, string>();
  }

  /// METHODS ///
  registerNode(
    IP: string,
    CPU_pct: number,
    clockrate_GHz: number,
    RAM_GB: number,
    BW_utilization: number,
    RTT_ms: number,
    cores: number,
    BW: number
  ) {
    return {
      send: async (tx: TX_Object) => {
        const sender = tx.from;
        return new Promise((resolve, reject) => {
          if (this._nodeExists(sender)) {
            reject("Node already registered: " + sender);
          } else {
            this._allNodes.push(sender);
            const resources = {
              CPU_pct,
              clockrate_GHz,
              RAM_GB,
              BW_utilization,
              RTT_ms,
              cores,
              BW,
            };
            this._resources.set(sender, resources);
            this._emitNewNode(sender, IP, JSON.stringify(resources));
            resolve(sender);
          }
        });
      },
    };
  }

  registerAsset(
    to: string,
    CPU_pct: number,
    clockrate_GHz: number,
    RAM_GB: number,
    BW_utilization: number,
    RTT_ms: number,
    cores: number,
    BW: number
  ) {
    return {
      send: async (tx: TX_Object) => {
        return new Promise((resolve, reject) => {
          if (!this._nodeExists(to)) reject("Node not registered: " + to);
          const requirements = {
            CPU_pct,
            clockrate_GHz,
            RAM_GB,
            BW_utilization,
            RTT_ms,
            cores,
            BW,
          };

          Object.keys(requirements).forEach((key) => {
            if (requirements[key] > this._resources.get(to)[key])
              reject(`Node ${to} does not fulfill Asset requirements.`);
          });

          this._ownerOf.set(++this._currentId, to);
          this._requirements.set(this._currentId, requirements);
          console.log(`Asset registered: ${this._currentId}`);
          this._emitNewAsset(this._currentId, to, JSON.stringify(requirements));
          resolve(this._currentId);
        });
      },
    };
  }

  setInheritor(assetID: number, inheritor: string) {
    return {
      send: async (tx: TX_Object) => {
        return new Promise((resolve, reject) => {
          if (!this._assetExists(assetID)) {
            reject(new Error(`Asset does not exist: ${assetID} `));
          }

          if (!this._nodeExists(inheritor))
            reject(new Error("Node not registered: " + inheritor));

          const requirements = this._requirements.get(assetID);

          Object.keys(requirements).forEach((key) => {
            if (requirements[key] > this._resources.get(inheritor)[key])
              reject(
                new Error("Inheritor does not fulfill Asset requirements.")
              );
          });

          if (inheritor === this._ownerOf.get(assetID))
            reject(
              new Error("local Machine cannot be Inheritor for the same asset.")
            );

          if (inheritor === this._inheritor.get(assetID))
            reject(
              new Error("Node is already the Inheritor of asset: " + assetID)
            );

          if (
            this._executors.get(assetID) &&
            this._executors.get(assetID).includes(inheritor)
          )
            reject(
              new Error("Node is already a Executor of Asset: " + assetID)
            );
          this._inheritor.set(assetID, inheritor);
          this._emitInheritorChosen(inheritor, assetID);
          resolve(inheritor);
        });
      },
    };
  }

  setExecutor(assetID: number, executor: string) {
    return {
      send: async (tx: TX_Object) => {
        return new Promise((resolve, reject) => {
          if (!this._assetExists(assetID))
            reject("Asset does not exist: " + assetID);

          if (!this._nodeExists(executor))
            reject("Node does not exist: " + executor);

          if (executor === this._ownerOf.get(assetID))
            reject("Executor cannot be local Machine of the same Asset.");

          if (this._isExecutor(assetID, executor))
            reject("Node is already a Executor of Asset: " + assetID);

          if (this._executors.get(assetID) === undefined) {
            this._executors.set(assetID, [executor]);
            this._emitExecutorChosen(executor, assetID);
            resolve(this._executors.get(assetID));
          } else {
            const executors = this._executors.get(assetID);
            executors.push(executor);
            this._executors.set(assetID, executors);
            this._emitExecutorChosen(executor, assetID);
            resolve(this._executors.get(assetID));
          }
        });
      },
    };
  }

  setPassword(assetID: number, password: string) {
    return {
      send: async (tx: TX_Object) => {
        return new Promise((resolve, reject) => {
          if (!this._assetExists(assetID)) reject("Asset does not exist.");

          const hash = crypto.createHash("sha256");
          hash.update(password);
          const password_hash = hash.digest("hex");

          this._password.set(assetID, password_hash);
          resolve("Password set.");
        });
      },
    };
  }

  transferAsset(assetID: number, to: string, password: string) {
    return {
      send: async (tx: TX_Object) => {
        return new Promise((resolve, reject) => {
          if (!this._assetExists(assetID))
            reject("Asset does not exist: " + assetID);

          if (!this._nodeExists(to)) reject("Node does not exist: " + to);

          const hash = crypto.createHash("sha256");
          hash.update(password);
          const password_hash = hash.digest("hex");
          if (password_hash != this._password.get(assetID)) {
            console.log(
              `Wrong password. Given: ${password_hash}, Actual: ${this._password.get(assetID)}`
            );
            reject("Password incorrect.");
          }

          if (!this._isInheritor(assetID, to))
            reject("Node is not the Inheritor of Asset: " + assetID);

          const currentOwner = this._ownerOf.get(assetID);
          console.log(`Transfering asset #${assetID} to ${to}`);
          this._ownerOf.set(assetID, to);
          this._inheritor.set(assetID, undefined);
          this._executors.set(assetID, undefined);
          this._emitTransfer(currentOwner, to, assetID);
          resolve(to);
        });
      },
    };
  }

  transferToOriginalOwner(assetID: number) {}

  _mint(to: string): void {}

  ownerOf(assetID: number): string {
    return this._ownerOf.get(assetID);
  }

  // Check functions
  private _nodeExists = function (address: string): boolean {
    return this._allNodes.includes(address);
  };

  private _assetExists(assetID: number): boolean {
    return this._ownerOf.has(assetID);
  }

  private _isExecutor = function (assetID: number, addr: string): boolean {
    const executors = this._executors.get(assetID);
    if (executors) {
      return executors.includes[addr];
    } else {
      return false;
    }
  };

  private _isInheritor = function (assetID: number, addr: string): boolean {
    return this._inheritor.get(assetID) === addr;
  };

  /// EVENT API ///
  getPastEvents = async (
    event: string,
    options: Options = undefined,
    callback: Function = undefined
  ): Promise<ContractEvent[]> => {
    return new Promise((resolve, reject) => {
      const events = this._pastEvents.filter((e: ContractEvent) => {
        return e.event === event;
      });

      if (!options?.filter) {
        resolve(events);
      } else {
        let filteredEvents: ContractEvent[] = events.filter(
          (event: ContractEvent) => {
            const filter = options.filter;
            const topics = event.raw.topics;
            switch (event.event) {
              case "NewNode":
                if (filter.addr !== topics[0]) return false;
                break;
              case "NewAsset":
                if (filter.ID && parseInt(filter.ID) !== topics[0]) {
                  return false;
                } else if (filter.owner && filter.owner !== topics[1]) {
                  return false;
                }
                break;
              case "InheritorChosen":
                if (filter.inheritor && filter.inheritor !== topics[0]) {
                  return false;
                } else if (
                  filter.assetID &&
                  parseInt(filter.assetID) !== topics[1]
                ) {
                  return false;
                }
                break;
              case "ExecutorChosen":
                if (filter.executor && filter.executor !== topics[0]) {
                  return false;
                } else if (
                  filter.assetID &&
                  parseInt(filter.assetID) !== topics[1]
                ) {
                  console.log(`  ${filter.assetID} !== ${topics[1]}`);
                  return false;
                }
                break;
              case "Transfer":
                if (filter._from && filter._from !== topics[0]) {
                  return false;
                } else if (filter._to && filter._to !== topics[1]) {
                  return false;
                } else if (
                  filter._tokenId &&
                  parseInt(filter._tokenId) !== topics[2]
                ) {
                  return false;
                }
                break;
            }
            return true;
          }
        );
        resolve(filteredEvents);
      }
    });
  };

  once = function (
    event: string,
    options: Options,
    callback: (error: Error, event: ContractEvent) => void
  ) {
    const filter = options?.filter;
    if (!filter)
      return eventEmitter.once(event, (data) => {
        callback(undefined, data);
      });

    eventEmitter.on(event, function cb(data: ContractEvent) {
      const topics = data.raw.topics;

      switch (event) {
        case "NewNode":
          if (filter.addr !== topics[0]) return;
          break;
        case "NewAsset":
          if (filter.ID && parseInt(filter.ID) !== topics[0]) {
            return;
          } else if (filter.owner && filter.owner !== topics[1]) {
            return;
          }
          break;
        case "InheritorChosen":
          if (filter.inheritor && filter.inheritor !== topics[0]) {
            return;
          } else if (filter.assetID && parseInt(filter.assetID) !== topics[1]) {
            return;
          }
          break;
        case "ExecutorChosen":
          if (filter.executor && filter.executor !== topics[0]) {
            return;
          } else if (filter.assetID && parseInt(filter.assetID) !== topics[1]) {
            return;
          }
          break;
        case "Transfer":
          if (filter._from && filter._from !== topics[0]) {
            return false;
          } else if (filter._to && filter._to !== topics[1]) {
            return false;
          } else if (
            filter._tokenId &&
            parseInt(filter._tokenId) !== topics[2]
          ) {
            return false;
          }
          break;
      }
      eventEmitter.removeListener(event, cb);
      callback(undefined, data);
    });
  };

  events = {
    NewNode: (options: Options, callback: (...args: any[]) => void) => {
      const filter = options?.filter;
      if (!filter) {
        eventEmitter.on("NewNode", (data) => callback(undefined, data));
        return;
      }
      eventEmitter.on("NewNode", (data) => {
        const topics = data.raw.topics;
        if (filter.addr === topics[0]) callback(undefined, data);
      });
    },
    NewAsset: (options: Options, callback: (...args: any[]) => void) => {
      const filter = options?.filter;
      if (!filter) {
        eventEmitter.on("NewAsset", (data) => callback(undefined, data));
        return;
      }
      eventEmitter.on("NewAsset", (data) => {
        const topics = data.raw.topics;
        if (
          (filter.ID && parseInt(filter.ID) !== topics[0]) ||
          (filter.owner && filter.owner !== topics[1])
        ) {
          return;
        }
        callback(undefined, data);
      });
    },
    InheritorChosen: (options: Options, callback: (...args: any[]) => void) => {
      const filter = options?.filter;
      if (!filter) {
        eventEmitter.on("InheritorChosen", (data) => callback(undefined, data));
        return;
      }
      eventEmitter.on("InheritorChosen", (data) => {
        const topics = data.raw.topics;
        if (
          (filter.inheritor && filter.inheritor !== topics[0]) ||
          (filter.assetID && parseInt(filter.assetID) !== topics[1])
        ) {
          return;
        }
        callback(undefined, data);
      });
    },
    ExecutorChosen: (options: Options, callback: (...args: any[]) => void) => {
      const filter = options?.filter;
      if (!filter) {
        eventEmitter.on("ExecutorChosen", (data) => callback(undefined, data));
        return;
      }
      eventEmitter.on("ExecutorChosen", (data) => {
        const topics = data.raw.topics;
        if (
          (filter.executor && filter.executor !== topics[0]) ||
          (filter.assetID && parseInt(filter.assetID) !== topics[1])
        ) {
          return;
        }
        callback(undefined, data);
      });
    },
  };

  private _emitNewNode(addr: address, IP: IP, resources: string): void {
    console.log("Emitting 'NewNode'");
    const event: NewNode = {
      event: "NewNode",
      returnValues: {
        addr,
        IP,
        resources,
      },
      raw: {
        topics: [addr],
      },
    };
    this._pastEvents.push(event);
    eventEmitter.emit("NewNode", event);
  }

  private _emitNewAsset(
    ID: number,
    owner: address,
    requirements: string
  ): void {
    const event: NewAsset = {
      event: "NewAsset",
      returnValues: {
        ID,
        owner,
        requirements,
      },
      raw: {
        topics: [ID, owner],
      },
    };
    this._pastEvents.push(event);
    eventEmitter.emit("NewAsset", event);
  }

  private _emitInheritorChosen(inheritor: address, assetID: number): void {
    const event: InheritorChosen = {
      event: "InheritorChosen",
      returnValues: {
        inheritor,
        assetID,
      },
      raw: {
        topics: [inheritor, assetID],
      },
    };
    this._pastEvents.push(event);
    eventEmitter.emit("InheritorChosen", event);
  }

  private _emitExecutorChosen(executor: address, assetID: number): void {
    const event: ExecutorChosen = {
      event: "ExecutorChosen",
      returnValues: {
        executor,
        assetID,
      },
      raw: {
        topics: [executor, assetID],
      },
    };
    this._pastEvents.push(event);
    eventEmitter.emit("ExecutorChosen", event);
  }

  private _emitTransfer(_from: address, _to: address, _tokenId: number): void {
    const event: Transfer = {
      event: "Transfer",
      returnValues: {
        _from,
        _to,
        _tokenId,
      },
      raw: {
        topics: [_from, _to, _tokenId],
      },
    };
    this._pastEvents.push(event);
    eventEmitter.emit("Transfer", event);
  }
  private _pastEvents: ContractEvent[];
}
