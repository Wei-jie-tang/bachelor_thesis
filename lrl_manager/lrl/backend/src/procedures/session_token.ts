import {
  generateECDHKeyPair,
  encryptSessionToken,
  decryptSessionToken,
} from "../common/cryptography/encrypt_ecdh";

/**
 * Generates ECDH key pairs for all participants and exchanges public keys.
 */
export function exchangeECDHKeys(
  testator: string,
  executors: string[],
  inheritor: string
): {
  ecdhKeys: { [key: string]: { publicKey: Buffer; privateKey: Buffer } };
  distributedPublicKeys: { [key: string]: Buffer };
} {
  console.log("Starting ECDH key exchange...");

  // Generate ECDH key pairs
  let ecdhKeys: { [key: string]: { publicKey: Buffer; privateKey: Buffer } } =
    {};
  for (const node of [testator, ...executors, inheritor]) {
    ecdhKeys[node] = generateECDHKeyPair();
  }

  console.log("ECDH keys generated:", ecdhKeys);

  // Collect public keys
  let publicKeys: { [key: string]: Buffer } = {};
  for (const node in ecdhKeys) {
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

  let encryptedTokens: { [key: string]: string } = {};
  for (const node of [...executors, inheritor]) {
    encryptedTokens[node] = encryptSessionToken(
      "session-token",
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
