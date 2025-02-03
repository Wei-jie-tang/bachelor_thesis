import path from "path";
import crypto from "crypto";
import fs from "fs";
import { pipeline } from "stream";

const algorithm = "aes-256-cbc";

function encryptFileSync(src, dest, password) {
  // const fileExtension = path.extname(src);
  // const filename = path.basename(src, fileExtension);
  const key = crypto.scryptSync(password, "salt", 32);
  // Create random initialization vector (length=16)
  const iv = crypto.randomBytes(16);
  console.log("ENC: IV = " + typeof iv + iv.toString("hex"));

  // Create Cipher
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  // Create input/output stream
  const data = fs.readFileSync(src).toString();

  let data_enc = cipher.update(data);
  data_enc = Buffer.concat([data_enc, cipher.final()]);

  const dir_dest = path.dirname(dest);
  if (!fs.existsSync(dir_dest)) fs.mkdirSync(dir_dest);
  fs.writeFileSync(dest, data_enc);
  return iv.toString("hex");
}

async function encryptFile(src, dest, password) {
  const fileExtension = path.extname(src);
  const filename = path.basename(src, fileExtension);
  return new Promise<string>((resolve, reject) => {
    // Generate key (length=32 for aes256)
    crypto.scrypt(password, "salt", 32, (err, key) => {
      if (err) reject(err);

      // Create random initialization vector (length=16)
      const iv = crypto.randomBytes(16);

      // Create Cipher
      const cipher = crypto.createCipheriv(algorithm, key, iv);

      // Create input/output stream
      const input = fs.createReadStream(src);
      const output = fs.createWriteStream(path.join(dest, filename + ".enc"));

      pipeline(input, cipher, output, (err) => {
        if (err) reject(err);

        resolve(iv.toString());
      });
    });
  });
}
async function decryptFile(src, dest, password, iv) {
  console.log("DEC: IV = " + typeof iv + iv);
  // const filename = path.basename(src, ".enc");
  const key = crypto.scryptSync(password, "salt", 32);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  const input = fs.createReadStream(src);
  const output = fs.createWriteStream(dest);

  return new Promise((resolve, reject) => {
    pipeline(input, decipher, output, (err) => {
      if (err) reject(err);

      resolve(dest);
    });
  });
}

function hash(algorithm, data) {
  const hash = crypto.createHash(algorithm);
  hash.update(data);
  return hash.digest("hex");
}

export default { encryptFile, encryptFileSync, decryptFile, hash };
