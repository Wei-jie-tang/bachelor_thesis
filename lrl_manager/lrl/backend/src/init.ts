import _ from "lodash";
import express from "express";
import selfRouter from "./routes/self";
import contractRouter from "./routes/contract_methods";
import eventListener from "./common/contract/dummy/routes/eventListener";
import rsa from "./common/cryptography/rsa";

export function init() {
  const [publicKey, privateKey] = rsa.generateKeyPair(__dirname + "/../keys");

  const app = express();
  const port = 8500;
  app.use(selfRouter);
  app.use(contractRouter);
  app.use(eventListener);

  app.listen(port, () =>
    console.log(`Listening to User Input at port ${port}`)
  );
}
