import express from "express";
import bodyParser from "body-parser";
import { execute } from "../subscriptions";

const router = express.Router();
router.use(express.json());
router.post("/eventListener/:subID", (req, res) => {
  console.log("Event caught: " + req.params.subID);
  const event = req.body;
  const subID = global.parseInt(req.params.subID);
  execute(subID, undefined, event);
  res.status(202);
  res.send();
});

export default router;
