import express from "express";
import { methodRouter } from "./server/routes/methods";
import { eventRouter } from "./server/routes/events";

const port = 8080;
const app = express();
app.use(methodRouter);
app.use(eventRouter);
app.get("/", (req, res) => {
  console.log("Received request");

  res.send("Hello from Dummycontract!");
});
app.listen(port, () => console.log(`Server listening on port ${port}`));
