const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const axios = require("axios");

const app = express();
const PORT = 3500;  
app.use(express.json());


const PUBLIC_KEY = fs.readFileSync("./keys/public.pem", "utf8");
console.log("Public Key Loaded:", PUBLIC_KEY ? "Yes" : "No");

//console.log("Private Key:", PRIVATE_KEY);
//console.log("Public Key:", PUBLIC_KEY);
const PRIVATE_KEY = fs.readFileSync("./keys/private.pem", "utf8");
console.log("Private Key Loaded:", PRIVATE_KEY ? "Yes" : "No");


// Token Generator
function generateToken(containerName, action) {
  const payload = `${containerName}:${action}:${Date.now()}`;
  const hash = crypto.createHash("sha256").update(payload).digest("hex");
  
  const sign = crypto.sign("sha256", Buffer.from(hash), {
    key: PRIVATE_KEY,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
  });

  return Buffer.from(JSON.stringify({ payload, signature: sign.toString("base64") })).toString("base64");
}

//Send token to Receiver
app.post("/token-manage", async (req, res) => {
  const { containerName, action } = req.body;
  console.log("1");
  // TOKEN GENERATE
  const token = generateToken(containerName, action);
  console.log("s");

  try {
    // SEND TOKEN AND PUBLIC KEY
    const response = await axios.post("http://lrl_manager:3600/token_manage", {
      token,
      publicKey: PUBLIC_KEY,
    });

    res.json(response.data);
  } catch (err) {
    console.error("Error executing action in inner container:", err.message);
    res.status(500).json({ error: "Failed to execute action in container B." });
  }
});

app.listen(PORT, () => {
  console.log(`Container is running on http://localhost:${PORT}`);
});
