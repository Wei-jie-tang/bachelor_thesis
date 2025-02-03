import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

router.post("/:assetID/fragment", (req, res) => {
  const assetID = req.params.assetID;
});

router.post("/:assetID/testament", (req, res) => {});

router.post("/:assetID/key", (req, res) => {});

export default router;
