import WebSocket from "ws";
import wrtc from "wrtc";

const { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate } = wrtc;

let sessionId = "test-session";
const nodeId = `node-${Math.floor(Math.random() * 1000)}`;
const signalingServer = new WebSocket("ws://localhost:4000");

const peerConnections = new Map();
const dataChannels = new Map();
const pendingCandidates = new Map();
const addedCandidates = new Set();
signalingServer.on("open", () => {
  console.log("Connected to signaling server");
  signalingServer.send(JSON.stringify({ type: "join", sessionId, nodeId }));
});

signalingServer.on("message", async (message) => {
  try {
    const data = JSON.parse(message.toString());
    if (data.type === "sessionId") {
      sessionId = data.sessionId || "test-session"; // Assign received session ID
      console.log(`Updated session ID: ${sessionId}`);
    }

    if (data.type === "peers") {
      console.log("Received peer list:", data.peers);
      data.peers.forEach((peer) => {
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
      console.log(`Remote description set for ${data.nodeId}`);
      processPendingCandidates(data.nodeId);
      if (pendingCandidates.has(data.nodeId)) {
        pendingCandidates.get(data.nodeId).forEach(async (candidate) => {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        });
        pendingCandidates.delete(data.nodeId);
      }
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      signalingServer.send(
        JSON.stringify({ type: "answer", sdp: answer, nodeId, sessionId })
      );
    }

    if (data.type === "answer") {
      console.log(`Received answer from ${data.nodeId}`);
      const peer = peerConnections.get(data.nodeId);
      if (!peer) {
        console.warn(
          `Peer connection for ${data.nodeId} not found. Creating one.`
        );
        peer = await createPeerConnection(data.nodeId, false);
      }
      if (peer) {
        if (!peer.remoteDescription) {
          await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
          console.log(`Successfully set remote description for ${data.nodeId}`);
          processPendingCandidates(data.nodeId);
        } else {
          console.warn(
            `Remote description already set for ${data.nodeId}, skipping.`
          );
        }
      } else {
        console.warn(`No peer connection found for ${data.nodeId}`);
      }
    }

    if (data.type === "candidate") {
      console.log(`Received ICE candidate from ${data.nodeId}`);

      let peer = peerConnections.get(data.nodeId);
      if (!peer) {
        console.warn(`No peer connection for ${data.nodeId}. Creating one.`);
        peer = await createPeerConnection(data.nodeId, false);
      }
      if (peer) {
        if (peer.remoteDescription && peer.remoteDescription.type) {
          await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log(`Successfully added ICE candidate from ${data.nodeId}`);
        } else {
          console.warn(
            `Received ICE candidate before remote description was set. Storing it.`
          );
          // Store the candidate in a queue to be added later
          if (!pendingCandidates.has(data.nodeId)) {
            pendingCandidates.set(data.nodeId, []);
          }
          pendingCandidates.get(data.nodeId).push(data.candidate);
        }
      } else {
        console.warn(`No peer connection found for ${data.nodeId}`);
      }
    }
  } catch (error) {
    console.error("Error handling signaling message:", error);
  }
});

async function createPeerConnection(peerId, isInitiator) {
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
            peerId,
          })
        );
      }
    };

    peer.ondatachannel = (event) => {
      console.log(` Received data channel from ${peerId}`);
      setupDataChannel(peerId, event.channel);
    };

    if (isInitiator) {
      console.log(`Creating data channel for ${peerId}`);
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
function processPendingCandidates(peerId) {
  const peer = peerConnections.get(peerId);
  if (!peer) return;

  const candidates = pendingCandidates.get(peerId);
  if (candidates && peer.remoteDescription) {
    candidates.forEach(async (candidate) => {
      await addUniqueIceCandidate(peer, candidate);
    });
    pendingCandidates.delete(peerId);
  }
}
function setupDataChannel(peerId, dataChannel) {
  console.log(`Setting up data channel with ${peerId}`);
  dataChannels.set(peerId, dataChannel);
  dataChannel.onopen = () => {
    console.log(`Data channel opened with ${peerId}`);
    dataChannel.send(`Hello from ${nodeId}`);
  };
  dataChannel.binaryType = "arraybuffer";
  dataChannel.onmessage = (event) =>
    console.log(`Received from ${peerId}: ${event.data}`);
  dataChannel.onerror = (error) =>
    console.error(`Data channel error with ${peerId}:`, error);
  dataChannel.onclose = () => console.log(`Data channel closed with ${peerId}`);
}

async function addUniqueIceCandidate(peer, candidate) {
  try {
    if (!addedCandidates.has(candidate.candidate)) {
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
      addedCandidates.add(candidate.candidate);
      console.log("Added new ICE candidate:", candidate);
    } else {
      console.warn("Duplicate ICE candidate ignored:", candidate);
    }
  } catch (error) {
    console.error("Error adding ICE candidate:", error);
  }
}
