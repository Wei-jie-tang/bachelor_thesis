import { NetworkManager } from "./kademlia/NetworkManager";
import { generateECDHKeyPair } from "./common/cryptography/encrypt_ecdh";
import { D_ASSET } from "./common/constants";

export class Self {
  static instance: Self;
  public network?: NetworkManager;
  public publicKey: string;
  public resources = {
    cpu: 0,
    ram: 0,
    bandwidth: 0,
  };

  private constructor() {}

  static getInstance(): Self {
    if (!Self.instance) {
      Self.instance = new Self();
    }
    return Self.instance;
  }

  async initialize(config: { cpu: number; ram: number; bandwidth: number }) {
    // 生成 ECDH 密钥对
    const { publicKey, privateKey } = generateECDHKeyPair();
    this.publicKey = publicKey.toString("hex");

    // 初始化资源
    this.resources = config;

    // 启动 Kademlia 网络
    this.network = new NetworkManager(
      crypto.randomUUID(), // 生成唯一节点ID
      this.publicKey,
      {
        onPeerDiscovered: (peer) => {
          console.log(
            `发现新节点: ${peer.address} (CPU: ${peer.resources.cpu}%)`
          );
        },
      }
    );

    await this.network.start();
  }

  get nodeInfo() {
    return {
      publicKey: this.publicKey,
      resources: this.resources,
    };
  }
}
