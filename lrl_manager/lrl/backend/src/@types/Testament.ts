import fs from "fs";
import path from "path";
import { generatePassword } from "../common/cryptography/password";
import aes from "../common/cryptography/aes";
import { splitData } from "../common/cryptography/shamir";
import { sendFile } from "../common/utils";

export class Testament {
  constructor(
    assetID: number,
    asset_key: string,
    iv: string,
    asset_fragments: string[]
  ) {
    this.assetID = assetID;
    this.fragments = asset_fragments;
    this.asset_key = asset_key;
    this.asset_iv = iv;
  }

  protected assetID: number;
  protected path: string;

  private fragments: string[];
  private asset_key: string;
  private asset_iv: string;
  private fileSaved: boolean = false;

  saveTestament(directory: string): Testament {
    const filePath = path.join(
      directory,
      `asset${this.assetID}`,
      "testament.json"
    );
    const data = JSON.stringify({
      shares: this.fragments,
      key: this.asset_key,
      iv: this.asset_iv,
    });

    fs.writeFileSync(filePath, data);

    this.path = filePath;
    this.fileSaved = true;
    return this;
  }

  encryptTestament(destinationPath: string): Testament_enc {
    if (this.fileSaved === false)
      throw new Error("Can't encrypt Testament before saving to file");

    try {
      const dest = path.join(
        destinationPath,
        `asset${this.assetID}`,
        "testament.enc"
      );
      console.log("Encrypting Testament to " + dest);
      const testament_key = generatePassword(12);
      const testament_iv = aes.encryptFileSync(this.path, dest, testament_key);

      return new Testament_enc(
        this.assetID,
        testament_key,
        testament_iv,
        this.asset_key,
        this.asset_iv,
        this.fragments
      );
    } catch (err) {
      console.error("Error encrypting Testament: " + err);
    }
  }
}

class Testament_enc extends Testament {
  constructor(
    assetID: number,
    testament_key: string,
    testament_iv: string,
    asset_key: string,
    asset_iv: string,
    asset_fragments: string[]
  ) {
    super(assetID, asset_key, asset_iv, asset_fragments);
    this.testament_key = testament_key;
    this.testament_iv = testament_iv;
  }
  private testament_key: string;
  private testament_iv: string;

  /**
   * Splits the Testament encryption key & initialization vector ("<key>/<iv>") via shamirs algorithm
   * @returns Keyset of Shamir keys
   * @param numExecutors Number of shamir keys generated
   * @param threshhold Threshold to reconstruct key
   */
  splitKey(numExecutors: number, threshhold: number, keyPath: string) {
    console.log(
      `Splitting ${keyPath} in ${numExecutors} parts with threshold: ${threshhold}`
    );
    const data = this.testament_key + "/" + this.testament_iv;
    try {
      return splitData(data, numExecutors, threshhold).assignAsset(
        this.assetID
      );
    } catch (err) {
      console.error("Error splitting Key: " + err);
    }
  }

  sendTestament(inheritor: string): Testament_enc {
    console.log(`Sending Testament to ${inheritor}`);
    try {
      sendFile(this.path, inheritor, `${this.assetID}/testament`);
      return this;
    } catch (err) {
      console.error("Error sending Testament: " + err);
    }
  }
}
