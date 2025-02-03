import express from "express";
import * as contractInterface from "../common/contract/dummy/interface";
import Self from "../LRLNode";
const router = express.Router();

router.get("/self", (req, res) => {
  console.log("Received request to '/self'");
  console.log("Redirecting to /self/address");
  res.redirect("/self/address");
});

router.get("/self/address", (req, res) => {
  console.log("Received request /self/address");
  const status = Self.status.get();

  if (status !== "registered") {
    console.log(`Node not yet registered. Status: ${status}`);
    res.status(204);
    res.json({ data: "", status });
  } else {
    res.status(200);
    console.log(`Sending to Client: 
    ${Self.addr}, ${status}`);
    res.json({ data: Self.addr, status });
  }
});

router.get("/self/status", (req, res) => {
  console.log("Received request /self/status");
  const status = Self.status.get();
  res.status(200);
  res.json({ data: "", status });
});

router.get("/self/resources", (req, res) => {
  console.log("Received request /self/resources");
  const status = Self.status.get();

  if (status !== "registered") {
    console.log(`Node not yet registered. Status: ${status}`);
    res.status(204);
    res.json({ status });
  } else {
    res.status(200);
    res.json({ data: Self.resources, status });
  }
});
export default router;
