import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { webSockets } from "@libp2p/websockets";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { mplex } from "@libp2p/mplex";
import { kadDHT } from "@libp2p/kad-dht";
import { identify } from "@libp2p/identify";

async function createBootstrapNode() {
  const node = await createLibp2p({
    addresses: {
      listen: ["/ip4/0.0.0.0/tcp/4001"], // 监听固定端口，允许其他节点连接
    },
    transports: [tcp(), webSockets()],
    connectionEncryption: [noise()],
    streamMuxers: [yamux(), mplex()],
    services: {
      identify: identify(),
      dht: kadDHT({ clientMode: false }), // 充当 DHT 服务器
    },
  });

  await node.start();
  console.log("Bootstrap Node started with PeerId:", node.peerId.toString());
  console.log(
    "Listening on:",
    node.getMultiaddrs().map((ma) => ma.toString())
  );

  return node;
}

createBootstrapNode();
