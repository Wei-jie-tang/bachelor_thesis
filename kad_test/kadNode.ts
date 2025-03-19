import { createLibp2p } from "libp2p";
import { kadDHT } from "@libp2p/kad-dht";
import { webRTC } from "@libp2p/webrtc";
import { noise } from "@chainsafe/libp2p-noise";
import { mplex } from "@libp2p/mplex";
import { identify } from "@libp2p/identify";
import { peerIdFromString } from "@libp2p/peer-id";

async function startNode() {
  const node = await createLibp2p({
    transports: [webRTC()],
    connectionEncrypters: [noise()],
    streamMuxers: [mplex()],
    services: {
      identify: identify(),
      dht: kadDHT(),
    },
  });

  console.log(`Node started with PeerId: ${node.peerId.toString()}`);

  return node;
}

startNode().catch(console.error);
