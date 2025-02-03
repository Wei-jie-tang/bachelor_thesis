import {
  LRLNode,
  Resources,
  address,
  Options,
  ContractEvent,
  EventCallback,
} from "interface-types";

interface f_registerNode {
  (self: LRLNode);
}
interface f_registerAsset {
  (self: LRLNode);
}
interface f_setInheritor {
  (assetID: number, inheritor: address, self: LRLNode);
}
interface f_setExecutor {
  (assetID: number, testamentor: address, self: LRLNode);
}
interface f_setPassword {
  (assetID: number, password_hash: string, self: LRLNode): void;
}
interface f_transferAsser {
  (assetID: number, inheritor: string, password_hash: string, self: LRLNode);
}
interface f_getPastEvents {
  (event: string, options: Options);
}
interface e_once {
  (event: string, options: Options, callback: EventCallback): void;
}

interface e_subscribe {
  (event: string, options: Options, callback: EventCallback): void;
}
