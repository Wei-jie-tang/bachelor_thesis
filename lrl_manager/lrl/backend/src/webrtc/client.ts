import WebSocket from "ws";
import wrtc, {
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from "wrtc";

interface WebRTCClient {
  sendData: (message: string) => void;
}

export async function startWebRTC(sessionToken: string): Promise<WebRTCClient> {
  if (!sessionToken) {
    throw new Error("Session token is required.");
  }

  console.log(`Starting WebRTC with Session Token: ${sessionToken}`);

  const signalingServer = new WebSocket(
    `ws://localhost:4000?token=${sessionToken}`
  );
  const peerConnections = new Map<string, RTCPeerConnection>();
  const dataChannels = new Map<string, RTCDataChannel>();

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
              peerId,
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
      }

      peerConnections.set(peerId, peer);
      return peer;
    } catch (error) {
      console.error(`Error creating peer connection for ${peerId}:`, error);
      return null;
    }
  }

  function setupDataChannel(peerId: string, dataChannel: RTCDataChannel): void {
    try {
      dataChannels.set(peerId, dataChannel);
      dataChannel.onopen = () =>
        console.log(`Data channel opened with ${peerId}`);
      dataChannel.onmessage = (event) =>
        console.log(`Received message from ${peerId}: ${event.data}`);
      dataChannel.onerror = (error) =>
        console.error(`Data channel error with ${peerId}:`, error);
      dataChannel.onclose = () =>
        console.log(`Data channel closed with ${peerId}`);
    } catch (error) {
      console.error(`Error setting up data channel for ${peerId}:`, error);
    }
  }

  signalingServer.on("message", async (message: string) => {
    try {
      const data = JSON.parse(message);
      const peerId = data.peerId as string;

      if (!peerId || peerId === sessionToken) return;

      if (data.type === "offer") {
        console.log(`Received offer from ${peerId}`);
        const peer = await createPeerConnection(peerId, false);
        if (!peer) return;
        await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        signalingServer.send(
          JSON.stringify({ type: "answer", sdp: answer, peerId })
        );
      }

      if (data.type === "answer" && peerConnections.has(peerId)) {
        console.log(`Received answer from ${peerId}`);
        await peerConnections
          .get(peerId)
          ?.setRemoteDescription(new RTCSessionDescription(data.sdp));
      }

      if (data.type === "candidate" && peerConnections.has(peerId)) {
        console.log(`Received ICE candidate from ${peerId}`);
        await peerConnections
          .get(peerId)
          ?.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    } catch (error) {
      console.error("Error handling signaling message:", error);
    }
  });

  signalingServer.on("open", async () => {
    console.log("Connected to signaling server");

    setTimeout(async () => {
      const peer = await createPeerConnection("global", true);
      if (!peer) return;
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      signalingServer.send(
        JSON.stringify({ type: "offer", sdp: offer, peerId: "global" })
      );
    }, 3000);
  });

  signalingServer.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  signalingServer.on("close", () => {
    console.log("Connection to signaling server closed");
  });

  return {
    sendData: (message: string) => {
      dataChannels.forEach((channel, peerId) => {
        if (channel.readyState === "open") {
          channel.send(message);
          console.log(`Sent data to ${peerId}: ${message}`);
        } else {
          console.log(
            `Cannot send data to ${peerId}, data channel is not open`
          );
        }
      });
    },
  };
}
