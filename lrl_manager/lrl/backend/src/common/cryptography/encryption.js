const { createReadStream, createWriteStream, writeFile } = require('fs');
const { pipeline } = require('stream');
const fs = require('fs');
const path = require('path');

const crypto = require('crypto');

const algorithm = 'aes-256-cbc';

exports.encryptFile = async function (src, dest, password) {
  const fileExtension = path.extname(src);
  const filename = path.basename(src, fileExtension);
  return new Promise((resolve, reject) => {
    // Generate key (length=32 for aes256)
    crypto.scrypt(password, 'salt', 32, (err, key) => {
      if (err) reject(err);

      // Create random initialization vector (length=16)
      crypto.randomFill(new Uint8Array(16), async (err, iv) => {
        if (err) reject(err);

        // Create Cipher
        const cipher = crypto.createCipheriv(algorithm, key, iv);

        // Create input/output stream
        const input = createReadStream(src);
        const output = createWriteStream(path.join(dest, filename + '.enc'));

        pipeline(input, cipher, output, (err) => {
          if (err) reject(err);

          const options = {
            src, // Plain text
            dest: path.join(dest, filename + '.enc'), // Cipher text
            fileExtension: fileExtension,
            iv: iv.toString(),
          };
          resolve(options);
        });
      });
    });
  });
};

exports.decryptFile = async function (src, dest, password, iv, fileExtension) {
  const filename = path.basename(src, '.enc');
  const key = crypto.scryptSync(password, 'salt', 32);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  const input = createReadStream(src);
  const output = createWriteStream(dest + filename + fileExtension);

  return new Promise((resolve, reject) => {
    pipeline(input, decipher, output, (err) => {
      if (err) reject(err);

      resolve(dest + filename + fileExtension);
    });
  });
};

exports.hash = function (algorithm, data) {
  const hash = crypto.createHash(algorithm);
  hash.update(data);
  return hash.digest('hex');
};
