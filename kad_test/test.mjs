import { kadDHT, removePrivateAddressesMapper } from "@libp2p/kad-dht";
import { createLibp2p } from "libp2p";
import { identify } from "@libp2p/identify";
import { peerIdFromString } from "@libp2p/peer-id";
import { createFromJSON } from "@libp2p/peer-id-factory";
import { noise } from "@chainsafe/libp2p-noise";
import { tcp } from "@libp2p/tcp";
import { mplex } from "@libp2p/mplex";

const node = await createLibp2p({
  addresses: {
    listen: ["/ip4/0.0.0.0/tcp/0", "/ip6/::/tcp/0"], // 监听所有 IP 地址上的随机端口
  },
  transports: [tcp()], // 添加传输协议
  connectionEncryption: [noise()], // 加密连接
  streamMuxers: [mplex()], // 多路复用器
  services: {
    dht: kadDHT({
      protocol: "/ipfs/kad/1.0.0",
      peerInfoMapper: removePrivateAddressesMapper,
    }),
    identify: identify(), // 添加 identify 服务
  },
});

const peerId = peerIdFromString("QmFoo");

try {
  const peerInfo = await node.peerRouting.findPeer(peerId);
  console.info(peerInfo); // 输出找到的 peer 信息
} catch (error) {
  console.error("Error finding peer:", error);
}
