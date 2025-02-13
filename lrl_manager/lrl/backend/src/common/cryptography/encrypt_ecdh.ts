import {
  createECDH,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from "crypto";

/**
 * Generates an ECDH key pair
 * @returns An ECDH key pair (private key and public key)
 */
export function generateECDHKeyPair(): {
  privateKey: Buffer;
  publicKey: Buffer;
} {
  const ecdh = createECDH("secp256k1"); // Use secp256k1 curve
  ecdh.generateKeys();
  return {
    privateKey: ecdh.getPrivateKey(),
    publicKey: ecdh.getPublicKey(),
  };
}

/**
 * Encrypts a session token using ECDH and AES
 * @param token - The session token to be encrypted
 * @param recipientPublicKey - The recipient's public key (used to compute the shared secret)
 * @param senderPrivateKey - The sender's private key (used to compute the shared secret)
 * @returns The encrypted session token
 */
export function encryptSessionToken(
  token: string,
  recipientPublicKey: Buffer,
  senderPrivateKey: Buffer
): string {
  // Generate ECDH object and compute the shared secret
  const ecdh = createECDH("secp256k1");
  ecdh.setPrivateKey(senderPrivateKey);
  const sharedSecret = ecdh.computeSecret(recipientPublicKey);

  // Generate a random salt
  const salt = randomBytes(16);

  // Combine the salt and the token together
  const saltedToken = Buffer.concat([salt, Buffer.from(token, "utf8")]);

  // Use the shared secret and AES to encrypt the token (with salt)
  const iv = randomBytes(16); // Initialization vector
  const cipher = createCipheriv("aes-256-gcm", sharedSecret.slice(0, 32), iv);
  const encrypted = Buffer.concat([cipher.update(saltedToken), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Return the encrypted data (including salt, iv, and authTag)
  return `${salt.toString("hex")}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts a session token using ECDH and AES
 * @param encryptedData - The encrypted session token (including salt, iv, authTag, and encryptedToken)
 * @param senderPublicKey - The sender's public key (used to compute the shared secret)
 * @param recipientPrivateKey - The recipient's private key (used to compute the shared secret)
 * @returns The decrypted session token
 */
export function decryptSessionToken(
  encryptedData: string,
  senderPublicKey: Buffer,
  recipientPrivateKey: Buffer
): string {
  const [saltHex, ivHex, authTagHex, encryptedTokenHex] =
    encryptedData.split(":");

  // Generate ECDH object and compute the shared secret
  const ecdh = createECDH("secp256k1");
  ecdh.setPrivateKey(recipientPrivateKey);
  const sharedSecret = ecdh.computeSecret(senderPublicKey);

  // Decrypt the token
  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encryptedToken = Buffer.from(encryptedTokenHex, "hex");

  // Use the same sharedSecret to decrypt
  const decipher = createDecipheriv(
    "aes-256-gcm",
    sharedSecret.slice(0, 32),
    iv
  );
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(encryptedToken),
    decipher.final(),
  ]);

  // Return the decrypted token, removing the salt part
  return decrypted.slice(salt.length).toString("utf8");
  // Remove the salt part and return the original token
}
