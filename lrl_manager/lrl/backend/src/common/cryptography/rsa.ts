import crypto from "crypto";
import fs from "fs";

function generateKeyPair(dest: string) {
  // Generates an object where the keys are stored in properties `privateKey` and `publicKey`
  const keyPair = crypto.generateKeyPairSync("rsa", {
    modulusLength: 4096, // bits - standard for RSA keys
    publicKeyEncoding: {
      type: "pkcs1", // "Public Key Cryptography Standards 1"
      format: "pem", // Most common formatting choice
    },
    privateKeyEncoding: {
      type: "pkcs1", // "Public Key Cryptography Standards 1"
      format: "pem", // Most common formatting choice
    },
  });

  // Create the public key file
  fs.writeFileSync(dest + "/id_rsa_public.pem", keyPair.publicKey);

  // Create the private key file
  fs.writeFileSync(dest + "/id_rsa_private.pem", keyPair.privateKey);
  return [keyPair.publicKey, keyPair.privateKey];
}

function createSignedHeartbeat(keyPath: string) {
  const keydata = fs.readFileSync(keyPath, "utf8");
  const timestamp = Date.now().toString();
  const data = Buffer.from(timestamp);
  // const privateKey = crypto.createPrivateKey({
  // key: keydata,
  // format: "pem",
  // type: "pkcs8",
  // });

  const signature = crypto.sign("sha256", data, keydata);

  return { timestamp, signature };
}

function validateSignature(
  data: string,
  signature: string,
  publicKey: crypto.KeyLike
) {
  return crypto.verify(
    "sha256",
    Buffer.from(data),
    publicKey,
    Buffer.from(signature)
  );
}

export default { generateKeyPair, createSignedHeartbeat, validateSignature };
