import { Resources } from "interface-types";
import {
  getAddressFromKeystore,
  getResourcesFromEnvironment,
  getResourcesFromFile,
} from "./common/utils";
type status = "registered" | "unregistered" | "pending";
class Status {
  private status: status;

  constructor() {
    this.status = "unregistered";
  }

  get() {
    return this.status;
  }

  update(updated: status) {
    this.status = updated;
  }
}

class LRLNode {
  addr: string;
  IP: string;
  resources: Resources;
  status;

  constructor() {
    this.addr = getAddressFromKeystore();
    this.resources = getResourcesFromEnvironment();
    this.status = new Status();
    this.IP = "10.5.0.11";
  }
}
const Self = new LRLNode();
export default Self;
