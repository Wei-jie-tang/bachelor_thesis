import {
  generateECDHKeyPair,
  encryptSessionToken,
  decryptSessionToken,
} from "../common/cryptography/encrypt_ecdh";
import { loadECDHKeys } from "./ecdh_key";
import crypto from "crypto";
export function exchangeECDHKeys(
  testator: string,
  executors: string[],
  inheritor: string
): {
  ecdhKeys: { [key: string]: { publicKey: Buffer; privateKey: Buffer } };
  distributedPublicKeys: { [key: string]: Buffer };
} {
  console.log("Starting ECDH key exchange...");

  // Load stored ECDH keys
  let rawECDHKeys = loadECDHKeys();

  // Ensure all nodes have keys
  const allNodes = [testator, ...executors, inheritor];
  for (const node of allNodes) {
    if (!rawECDHKeys[node]) {
      throw new Error(`Missing ECDH keys for node: ${node}`);
    }
  }

  console.log("ECDH keys loaded successfully.");

  // Convert stored keys (string → Buffer)
  let ecdhKeys: { [key: string]: { publicKey: Buffer; privateKey: Buffer } } =
    {};
  for (const node of allNodes) {
    ecdhKeys[node] = {
      publicKey: Buffer.from(rawECDHKeys[node].publicKey, "hex"),
      privateKey: Buffer.from(rawECDHKeys[node].privateKey, "hex"),
    };
  }

  // Collect public keys
  let publicKeys: { [key: string]: Buffer } = {};
  for (const node of allNodes) {
    publicKeys[node] = ecdhKeys[node].publicKey;
  }

  console.log("Public keys distributed:", publicKeys);

  // Distribute the Testator's public key to Executors & Inheritor
  let distributedPublicKeys: { [key: string]: Buffer } = {};
  for (const node of [...executors, inheritor]) {
    distributedPublicKeys[node] = publicKeys[testator];
  }

  console.log(
    "Testator sent public key to Executors & Inheritor:",
    distributedPublicKeys
  );

  return { ecdhKeys, distributedPublicKeys };
}

/**
 * Encrypts session tokens for Executors & Inheritor.
 */
export function encryptSessionTokens(
  testator: string,
  executors: string[],
  inheritor: string,
  ecdhKeys: { [key: string]: { publicKey: Buffer; privateKey: Buffer } }
): { [key: string]: string } {
  console.log("Encrypting session tokens...");
  const sessionId = crypto.randomBytes(16).toString("hex");

  let encryptedTokens: { [key: string]: string } = {};
  for (const node of [...executors, inheritor]) {
    let role = "testator";
    if (executors.includes(node)) role = "executor";
    if (node === inheritor) role = "inheritor";
    const payload = JSON.stringify({
      user: node, // Address of the participant
      session: sessionId, // Shared room ID for WebRTC
      role: role, // Role based on participant type
      exp: Math.floor(Date.now() / 1000) + 3600, // Token expires in 1 hour
    });
    encryptedTokens[node] = encryptSessionToken(
      payload,
      ecdhKeys[node].publicKey, // Recipient's public key
      ecdhKeys[testator].privateKey // Testator's private key
    );
  }

  console.log("Encrypted tokens:", encryptedTokens);
  return encryptedTokens;
}

/**
 * Decrypts session tokens received by Executors & Inheritor.
 */
export function decryptSessionTokens(
  executors: string[],
  inheritor: string,
  encryptedTokens: { [key: string]: string },
  distributedPublicKeys: { [key: string]: Buffer },
  ecdhKeys: { [key: string]: { publicKey: Buffer; privateKey: Buffer } }
): { [key: string]: string } {
  console.log("Decrypting session tokens...");

  let decryptedTokens: { [key: string]: string } = {};
  for (const node of [...executors, inheritor]) {
    try {
      decryptedTokens[node] = decryptSessionToken(
        encryptedTokens[node],
        distributedPublicKeys[node], // Testator's public key
        ecdhKeys[node].privateKey // Executor's/Inheritor's private key
      );
      console.log(`Decrypted token for ${node}:`, decryptedTokens[node]);
    } catch (err) {
      console.error(`Error decrypting token for ${node}:`, err);
    }
  }

  console.log("Decryption process completed.");
  return decryptedTokens;
}
