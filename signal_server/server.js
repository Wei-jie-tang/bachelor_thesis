const WebSocket = require("ws");
const {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
} = require("wrtc");

const SECRET_KEY = "your-secret-key";
const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ host: "0.0.0.0", port: PORT });

const sessions = new Map();
const pendingCandidates = []; // Store candidates temporarily before setting remote description

// WebSocket 服务器
wss.on("connection", (ws, req) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  const sessionId = "default-session"; // Here for simplicity, we can later integrate token-based session IDs

  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, new Set()); // 使用 Set 避免重复 WebSocket 连接
  }

  const sessionPeers = sessions.get(sessionId);
  sessionPeers.add(ws);
  console.log(`User connected to session: ${sessionId}`);

  // WebRTC Configuration
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  // 处理 ICE 候选
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("Sending ICE candidate:", event.candidate);
      ws.send(JSON.stringify({ candidate: event.candidate }));
    }
  };

  // 监听 WebSocket 消息，处理信令（answer、ICE）
  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.answer) {
        console.log("Received answer, setting remote description.");
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));

        // After setting remote description, send stored candidates if any
        pendingCandidates.forEach((candidate) => {
          pc.addIceCandidate(new RTCIceCandidate(candidate));
        });
        pendingCandidates.length = 0; // Clear the candidates list
      } else if (data.candidate) {
        if (pc.remoteDescription) {
          console.log("Adding ICE Candidate.");
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } else {
          console.warn(
            "ICE Candidate received before remoteDescription is set. Storing..."
          );
          pendingCandidates.push(data.candidate); // Store candidate until remote description is set
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  // 发送 WebRTC offer 给其他同 session 的设备
  const broadcastOffer = async () => {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sessionPeers.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ offer: pc.localDescription }));
        }
      });
    } catch (error) {
      console.error("Error creating or sending offer:", error);
    }
  };

  // 只在新设备加入时调用广播 offer
  broadcastOffer();

  // 监听 WebSocket 关闭，移除用户
  ws.on("close", () => {
    sessionPeers.delete(ws);
    if (sessionPeers.size === 0) {
      sessions.delete(sessionId); // 移除空的会话
    }
    console.log(`User disconnected from session: ${sessionId}`);
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);
