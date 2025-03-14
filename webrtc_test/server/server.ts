import WebSocket, { WebSocketServer } from "ws";
import { createServer } from "http";
import express from "express";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

interface Client {
  id: string;
  sessionId: string;
  socket: WebSocket;
  ip: string;
}

const sessions = new Map<string, Client[]>();

wss.on("connection", (socket, req) => {
  const ip = req.socket.remoteAddress || "unknown";
  console.log(`New connection from ${ip}`);

  socket.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === "join") {
        const { sessionId, nodeId } = data;
        const clients = sessions.get(sessionId) || [];

        clients.push({ id: nodeId, sessionId, socket, ip });
        sessions.set(sessionId, clients);
        console.log(`Node ${nodeId} joined session ${sessionId}`);

        // Send updated client list with IPs
        const peers = clients.map((client) => ({
          id: client.id,
          ip: client.ip,
        }));
        clients.forEach((client) => {
          client.socket.send(JSON.stringify({ type: "peers", peers }));
        });
      }

      if (["offer", "answer", "candidate"].includes(data.type)) {
        const clients = sessions.get(data.sessionId) || [];
        clients.forEach((client) => {
          if (client.id !== data.nodeId) {
            client.socket.send(JSON.stringify(data));
          }
        });
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  });

  socket.on("close", () => {
    sessions.forEach((clients, sessionId) => {
      const updatedClients = clients.filter((c) => c.socket !== socket);
      if (updatedClients.length > 0) {
        sessions.set(sessionId, updatedClients);
      } else {
        sessions.delete(sessionId);
      }
    });
    console.log("WebSocket closed");
  });
});

server.listen(4000, () => {
  console.log("Signaling server running on ws://localhost:4000");
});
