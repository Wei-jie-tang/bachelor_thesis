export const KADEMLIA_CONFIG = {
  bootstrap: ["bootstrap1.hyperdht.org:49737", "bootstrap2.hyperdht.org:49737"],
  announceInterval: 60_000, // 节点信息广播间隔 (ms)
  networkTopic: "my-p2p-network-v1", // 网络标识
};

export const NODE_CONFIG = {
  portRange: [40000, 40010], // 节点端口范围
  maxPeers: 50, // 最大连接节点数
};
