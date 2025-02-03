// Contract Types
export interface TX_Object {
  from: string;
  gas: number;
}

export type IP = string;
export type address = string;
export interface Options {
  filter?: {
    [key: string]: number | string;
  };
  fromBlock?: number | string;
  toBlock?: number | string;
}

export interface Resources {
  IP?: string;
  assetID?: string;
  CPU_pct: number;
  clockrate_GHz: number;
  RAM_GB: number;
  BW_utilization: number;
  RTT_ms: number;
  cores: number;
  BW: number;
}
export interface LRLNode {
  address: address;
  IP: IP;
  resources: Resources;
  status: "registered" | "unregistered" | "pending";
}

// Event types
export interface ContractEvent {
  event: string;
  returnValues: {
    [key: string]: any;
  };
  raw: {
    topics: any[];
  };
}
export interface EventCallback {
  (error: Error, event: ContractEvent): void;
}
export interface NewNode extends ContractEvent {
  event: "NewNode";
  returnValues: {
    addr: address;
    IP: IP;
    resources: string;
  };
  raw: {
    topics: [address];
  };
}

export interface NewAsset extends ContractEvent {
  event: "NewAsset";
  returnValues: {
    ID: number;
    owner: address;
    requirements: string;
  };
  raw: {
    topics: [number, address];
  };
}

export interface InheritorChosen extends ContractEvent {
  event: "InheritorChosen";
  returnValues: {
    inheritor: address;
    assetID: number;
  };
  raw: {
    topics: [address, number];
  };
}

export interface ExecutorChosen extends ContractEvent {
  event: "ExecutorChosen";
  returnValues: {
    executor: address;
    assetID: number;
  };
  raw: {
    topics: [address, number];
  };
}

export interface Transfer extends ContractEvent {
  event: "Transfer";
  returnValues: {
    _from: address;
    _to: address;
    _tokenId: number;
  };
}
// http Types
export function PostOption(host: string, path: string, port: string) {
  (this.host = host),
    (this.port = port),
    (this.method = "POST"),
    (this.headers = {
      "Content-Type": "application/json",
    }),
    (this.path = path);
}
