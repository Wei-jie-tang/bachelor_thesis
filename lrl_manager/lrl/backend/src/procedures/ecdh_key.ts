import fs from "fs";
import path from "path";
const keyStoragePath = path.join(__dirname, "ecdh_keys.json");
export function loadECDHKeys(): {
  [key: string]: { publicKey: string; privateKey: string };
} {
  if (fs.existsSync(keyStoragePath)) {
    const rawData = JSON.parse(fs.readFileSync(keyStoragePath, "utf8"));
    let parsedKeys: {
      [key: string]: { publicKey: Buffer; privateKey: Buffer };
    } = {};
    return JSON.parse(fs.readFileSync(keyStoragePath, "utf8"));
  }
  fs.writeFileSync(keyStoragePath, JSON.stringify({}, null, 2), "utf8");
  const emptyData = {}; // Create an empty JSON file;
  return emptyData;
}
export function saveECDHKeys(keys: {
  [key: string]: { publicKey: string; privateKey: string };
}) {
  fs.writeFileSync(keyStoragePath, JSON.stringify(keys, null, 2), "utf8");
}
