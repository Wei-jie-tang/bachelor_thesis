import { EventCallback, ContractEvent } from "interface-types";

const subsciptions = new Map<number, EventCallback>();

class EventSubscription {
  callback: EventCallback;
  once: boolean;

  constructor(callback: Function, once: boolean) {
    this.callback = callback;
    this.once = once;
  }

  exectute(error: Error, event: ContractEvent) {
    this.callback(error, event);
  }
}

export function addSubscription(ID: number, callback: Function, once: boolean) {
  subsciptions.set(ID, new EventSubscription(callback, once));
}
export function removeSubscription(ID: number) {
  subsciptions.delete(ID);
}
export function execute(ID: number, error: Error, event: ContractEvent) {
  subsciptions.get(ID).exectute(error, event);
}
