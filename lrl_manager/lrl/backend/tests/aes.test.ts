import { beforeAll, afterAll, describe, expect, test } from "@jest/globals";
import aes from "../src/common/cryptography/aes";
import path from "path";
import fs from "fs";
import { after } from "lodash";

const DIR_FILES = path.join(__dirname, "files");

describe("aes encryption", () => {
  const testData = "Hello World. This is sample data to test!";
  const password = "safePassword";
  let iv;

  beforeAll(() => {
    fs.writeFileSync(path.join(DIR_FILES, "test.txt"), testData);
  });
  afterAll(() => {
    const files = fs.readdirSync(DIR_FILES);

    for (const file of files) {
      fs.rmSync(path.join(DIR_FILES, file));
    }
  });

  describe("encryptFileSync()", () => {
    test("Encrypts an existing file", () => {
      const src = path.join(DIR_FILES, "test.txt");
      const dest = path.join(DIR_FILES, "test.enc");

      iv = aes.encryptFileSync(src, dest, password);

      const result = fs.readdirSync(path.dirname(dest));

      expect(result).toHaveLength(2);

      expect(result).toEqual(expect.arrayContaining(["test.enc"]));
    });

    test("Creates destination directory if it does not exist", () => {
      const src = path.join(DIR_FILES, "test.txt");
      const dest = path.join(DIR_FILES, "encdir", "test.enc");

      iv = aes.encryptFileSync(src, dest, password);

      const result = fs.readdirSync(path.dirname(dest));

      expect(result).toHaveLength(1);

      expect(result).toEqual(expect.arrayContaining(["test.enc"]));

      fs.rmdirSync(path.dirname(dest), { recursive: true });
    });
  });

  describe("decryptFile()", () => {
    test("Decrypts existing encrypted file", () => {
      const src = path.join(DIR_FILES, "test.enc");
      const dest = path.join(DIR_FILES, "test_dec.txt");
      return aes
        .decryptFile(src, dest, password, Buffer.from(iv, "hex"))
        .then((filepath) => {
          expect(filepath).toEqual(path.join(DIR_FILES, "test_dec.txt"));

          const files = fs.readdirSync(DIR_FILES);

          expect(files).toHaveLength(3);
          expect(files).toEqual(
            expect.arrayContaining(["test.txt", "test.enc", "test_dec.txt"])
          );
        });
    });
  });
});
