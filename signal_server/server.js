const WebSocket = require("ws");

const PORT = 4000;
const wss = new WebSocket.Server({ host: "0.0.0.0", port: PORT });

const sessions = new Map(); // Store sessions
const pendingCandidates = new Map(); // Store ICE candidates until remoteDescription is set

wss.on("connection", (ws) => {
  const sessionId = "default-session"; // Single session for now

  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, new Set());
  }

  const sessionPeers = sessions.get(sessionId);
  sessionPeers.add(ws);
  console.log(`User connected to session: ${sessionId}`);

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.offer) {
        console.log("Received offer, broadcasting to other peers...");
        sessionPeers.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ offer: data.offer }));
          }
        });
      } else if (data.answer) {
        console.log("Received answer, sending to the offerer...");
        sessionPeers.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ answer: data.answer }));
          }
        });
      } else if (data.candidate) {
        console.log("Received ICE candidate.");
        sessionPeers.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ candidate: data.candidate }));
          }
        });
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on("close", () => {
    sessionPeers.delete(ws);
    if (sessionPeers.size === 0) {
      sessions.delete(sessionId);
    }
    console.log(`User disconnected from session: ${sessionId}`);
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);
