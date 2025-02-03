import https from "https";
import path from "path";
import fs from "fs";
import aes from "../common/cryptography/aes";
import { D_ASSET, D_TMP } from "../common/constants";
import splitFile from "split-file";

export async function createServer(port: number, assetID: number) {
  https
    .createServer((req, res) => {
      switch (req.url) {
        case "/testament":
          break;
        case "/asset":
          break;
        case "/key":
          break;
      }
    })
    .listen(port);
}

// Returns filepath of decrypted testament
export async function decryptTestament(
  filePath: string,
  password: string,
  iv: string
) {
  return new Promise((resolve, reject) => {
    aes
      //FIXME:
      .decryptFile(filePath, D_ASSET, password, iv)
      .then((testament_path: string) => {
        resolve(testament_path);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
// Param: directory: directory with asset pieces
export async function mergeAsset(fragments: string[], dest: string) {
  console.log(`Merging ${fragments} to ${dest}`);
  const asset = path.join(dest, "asset.enc");
  return new Promise(async (resolve, reject) => {
    splitFile.mergeFiles(fragments, asset).then(() => {
      resolve(asset);
    });
  });
}

export function decryptAsset(filePath: string, key: string, iv: string) {
  aes
    //FIXME:
    .decryptFile(filePath, D_ASSET, key, iv);
}
/**
 * -> Asset pieces, Testament received
 * 1. Decrypt Testament
 * 2. Merge Asset
 * 3. Decrypt Asset
 */
