import sss from "shamirs-secret-sharing";
import { sendString } from "../utils";
import { keys } from "lodash";

export function splitData(
  data: string,
  numFragments: number,
  threshold: number
) {
  return new Keyset(data, numFragments, threshold);
}

function joinData(shares) {
  return sss.combine(shares).toString();
}

class Keyset {
  public assetID: number;
  private fragments: Keyfragment[] = [];

  constructor(data: string, shares: number, threshold: number) {
    const secret = Buffer.from(data);

    sss.split(secret, { shares, threshold }).forEach((fragmentData) => {
      this.fragments.push(new Keyfragment(this, fragmentData));
    });
  }

  assignAsset(assetID: number) {
    this.assetID = assetID;
    return this;
  }

  sendKeyFragments(executors: string[]) {
    console.log(`Sending key Fragments to ${executors}`);
    try {
      this.fragments.forEach((fragment, i) => {
        fragment.sendKeyFragment(executors[i]);
      });
    } catch (err) {
      console.error("Error sending key fragments: " + err);
    }
  }

  restore() {
    try {
      return sss.combine(this.fragments).toString();
    } catch (err) {
      console.error("Error combining Keys: " + err);
    }
  }
}

class Keyfragment {
  private data: string;
  public keyset: Keyset;

  constructor(keyset: Keyset, data: string) {
    this.data = data;
    this.keyset = keyset;
  }

  sendKeyFragment(executor: string) {
    sendString(this.data, executor, `${this.keyset.assetID}/key`);
  }
}
