import express from "express";
const port = process.env.HOST_PORT_CONTRACT;
const app = express();

app.listen(port, () =>
  console.log(`listening to Dummy contract on port ${port}`)
);
