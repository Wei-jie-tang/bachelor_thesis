import path from "path";
import Resources from "interface-types";
import splitFile from "split-file";
import { Testament } from "./@types/Testament";
import { generatePassword } from "./common/cryptography/password";
import { sendString } from "./common/utils";
import aes from "./common/cryptography/aes";
import { reject } from "lodash";
export class Asset {
  constructor(
    ID: number,
    path: string,
    resources: Resources,
    executors: string[],
    inheritor?: string
  ) {
    this.ID = ID;
    this.path = path;
    this.resources = resources;
    this.executors = executors;
  }

  public ID: number;
  protected path: string;
  protected resources: Resources;
  protected executors: string[];

  encryptAsset(destinationPath: string): Asset_enc {
    try {
      const asset_key = generatePassword(12);

      const dest = path.join(
        destinationPath,
        `asset${this.ID.toString()}`,
        "asset.enc"
      );
      console.log(`Encrypting asset #${this.ID} to ${dest}`);
      const asset_iv = aes.encryptFileSync(this.path, dest, asset_key);
      return new Asset_enc(
        this.ID,
        dest,
        this.resources,
        this.executors,
        asset_key,
        asset_iv
      );
    } catch (err) {
      console.error("Error encrypting asset: " + err);
    }
  }
}

class Asset_enc extends Asset {
  constructor(
    ID: number,
    path: string,
    resources: Resources,
    executors: string[],
    key: string,
    iv
  ) {
    super(ID, path, resources, executors);
    this.key = key;
    this.iv = iv;
  }
  private key: string;
  private iv: string;
  private fragments: string[];
  private split: boolean = false;

  async splitAsset(numFragments: number): Promise<Asset_enc> {
    return new Promise((resolve, reject) => {
      const filePath = this.path;
      console.log(`Splitting ${filePath} in ${numFragments} fragments`);
      splitFile
        .splitFile(filePath, numFragments)
        .then((fragments: string[]) => {
          this.fragments = fragments;
          this.split = true;
          console.log(`File fragments were placed in ${this.path}`);
          resolve(this);
        })
        .catch((err) => {
          console.log("Error: ", err);
          reject(err);
        });
    });
  }

  sendFragments(executors: string[]): Asset_enc {
    while (!this.split) {} // Wait for splitAsset() to finish
    try {
      executors.forEach((executor, i) => {
        console.log(`Sending fragment ${i} to ${executor}`);
        sendString(this.fragments[i], executor, `${this.ID}/fragment`);
      });
      return this;
    } catch (err) {
      console.error("Error sending Fragments: " + err);
    }
  }

  createTestament(directory: string): Testament {
    console.log(`Creating Testament in ${directory}`);
    try {
      const testament = new Testament(
        this.ID,
        this.key,
        this.iv,
        this.fragments
      );
      return testament.saveTestament(directory);
    } catch (err) {
      console.error("Error creating Testament: " + err);
    }
  }
}
