import { ContractEvent } from "interface-types";

const port = 8500;
export function emit(
  host: string | string[],
  subID: number,
  eventData: ContractEvent
) {
  console.log(`Emitting Event to ${host}: ${eventData.event}`);

  fetch(`http://${host}:${port}/eventListener/${subID}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventData),
  })
    .then((res) => {
      console.log(`Event emitted: ${subID}`);
    })
    .catch((err) => {
      console.error(`An Error occured while emitting Event #${subID}: ${err}`);
    });
}
