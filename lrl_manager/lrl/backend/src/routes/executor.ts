import express from "express";
const router = express.Router();
router.post("/:assetID/session_token", (req, res) => {
  const assetID = req.params.assetID;
});
router.post("/:assetid/fragment", (req, res) => {});

router.post("/:assetid/key", (req, res) => {});

export default router;
