const express = require("express");
const fs = require("fs");

const crypto = require("crypto");
const { exec } = require("child_process");

const app = express();
const PORT = 3600;
app.use(express.json());

let PUBLIC_KEY = "";

function verifyToken(token, publicKey) {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
    const { payload, signature } = decoded;

    const hash = crypto.createHash("sha256").update(payload).digest("hex");

    const isValid = crypto.verify(
      "sha256",
      Buffer.from(hash),
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      },
      Buffer.from(signature, "base64")
    );

    return isValid;
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return false;
  }
}

function grantDockerAccess() {
  return new Promise((resolve, reject) => {
    exec("sudo chmod 666 /var/run/docker.sock", (err, stdout, stderr) => {
      if (err) {
        console.error("Failed to grant Docker access:", stderr);
        return reject(new Error("Failed to grant Docker socket access."));
      }
      console.log("Granted Docker socket access.");
      resolve();
    });
  });
}

function revokeDockerAccess() {
  return new Promise((resolve, reject) => {
    exec("sudo chmod 660 /var/run/docker.sock", (err, stdout, stderr) => {
      if (err) {
        console.error("Failed to revoke Docker access:", stderr);
        return reject(new Error("Failed to revoke Docker socket access."));
      }
      console.log("Revoked Docker socket access.");
      resolve();
    });
  });
}

app.post("/token_manage", async (req, res) => {
  const { token, publicKey } = req.body;

  PUBLIC_KEY = publicKey;

  if (!verifyToken(token, PUBLIC_KEY)) {
    return res.status(403).json({ error: "Invalid token" });
  } else {
    console.log("Valid token");
  }

  const { payload } = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
  const [containerName, action, timestamp] = payload.split(":");

  console.log(
    `Action to be performed: ${action} on container: ${containerName} at ${timestamp}`
  );

  // Start NestedContainer
  if (action === "start") {
    try {
      await grantDockerAccess();
      const startTime = Date.now();
      const command = `
        cd lrl &&
        
        docker-compose -f /app/lrl/compose.yaml up --build
      `;

      exec(command, (err, stdout, stderr) => {
        const endTime = Date.now();
        const elapsedTime = ((endTime - startTime) / 1000).toFixed(2);
        if (err) {
          console.error("Docker Compose error:", stderr);
          revokeDockerAccess();
          return res
            .status(500)
            .json({ error: stderr, elapsedTime: `${elapsedTime} seconds` });
        }

        console.log(stdout);
        res.json({ message: "Docker Compose completed successfully." });

        revokeDockerAccess();
        console.log(
          "Docker socket access revoked after nested container started."
        );
      });
    } catch (err) {
      await revokeDockerAccess();
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(400).json({ error: "Invalid action." });
  }
});
app.listen(PORT, () => {
  console.log(`Container is running on http://localhost:${PORT}`);
});
