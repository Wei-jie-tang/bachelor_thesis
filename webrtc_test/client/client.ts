import WebSocket from "ws";
import wrtc, {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
} from "wrtc";

const sessionId = "test-session";
const nodeId = `node-${Math.floor(Math.random() * 1000)}`;
const signalingServer = new WebSocket(`ws://localhost:4000`);

const peerConnections = new Map<string, RTCPeerConnection>();
const dataChannels = new Map<string, RTCDataChannel>();

signalingServer.on("open", () => {
  console.log("Connected to signaling server");
  signalingServer.send(JSON.stringify({ type: "join", sessionId, nodeId }));
});

signalingServer.on("message", async (message) => {
  try {
    const data = JSON.parse(message.toString());

    if (data.type === "peers") {
      console.log("Received peer list:", data.peers);
      data.peers.forEach((peer: { id: string; ip: string }) => {
        if (peer.id !== nodeId && !peerConnections.has(peer.id)) {
          createPeerConnection(peer.id, true);
        }
      });
    }

    if (data.type === "offer") {
      console.log(`Received offer from ${data.nodeId}`);
      const peer = await createPeerConnection(data.nodeId, false);
      if (!peer) return;
      await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      signalingServer.send(
        JSON.stringify({ type: "answer", sdp: answer, nodeId, sessionId })
      );
    }

    if (data.type === "answer") {
      console.log(`Received answer from ${data.nodeId}`);
      await peerConnections
        .get(data.nodeId)
        ?.setRemoteDescription(new RTCSessionDescription(data.sdp));
    }

    if (data.type === "candidate") {
      console.log(`Received ICE candidate from ${data.nodeId}`);
      await peerConnections
        .get(data.nodeId)
        ?.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  } catch (error) {
    console.error("Error handling signaling message:", error);
  }
});

async function createPeerConnection(
  peerId: string,
  isInitiator: boolean
): Promise<RTCPeerConnection | null> {
  try {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        signalingServer.send(
          JSON.stringify({
            type: "candidate",
            candidate: event.candidate,
            nodeId,
            sessionId,
          })
        );
      }
    };

    peer.ondatachannel = (event) => {
      setupDataChannel(peerId, event.channel);
    };

    if (isInitiator) {
      const dataChannel = peer.createDataChannel("dataChannel");
      setupDataChannel(peerId, dataChannel);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      signalingServer.send(
        JSON.stringify({ type: "offer", sdp: offer, nodeId, sessionId })
      );
    }

    peerConnections.set(peerId, peer);
    return peer;
  } catch (error) {
    console.error(`Error creating peer connection for ${peerId}:`, error);
    return null;
  }
}

function setupDataChannel(peerId: string, dataChannel: RTCDataChannel): void {
  dataChannels.set(peerId, dataChannel);
  dataChannel.onopen = () => console.log(`Data channel opened with ${peerId}`);
  dataChannel.onmessage = (event) =>
    console.log(`Received from ${peerId}: ${event.data}`);
  dataChannel.onerror = (error) =>
    console.error(`Data channel error with ${peerId}:`, error);
  dataChannel.onclose = () => console.log(`Data channel closed with ${peerId}`);
}
