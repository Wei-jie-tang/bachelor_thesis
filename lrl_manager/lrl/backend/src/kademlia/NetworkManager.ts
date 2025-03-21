import DHT from "@hyperswarm/dht";
import crypto from "crypto";
import { KADEMLIA_CONFIG, NODE_CONFIG } from "../config";
import { PeerInfo, NetworkCallbacks } from "./types";

export class NetworkManager {
  private dht: DHT;
  private topic: Buffer;
  private peers = new Map<string, PeerInfo>();
  private announceInterval?: NodeJS.Timeout;

  constructor(
    private selfId: string,
    private publicKey: string,
    private callbacks?: NetworkCallbacks
  ) {
    this.topic = crypto
      .createHash("sha256")
      .update(KADEMLIA_CONFIG.networkTopic)
      .digest();

    this.dht = new DHT({
      bootstrap: KADEMLIA_CONFIG.bootstrap,
      port: NODE_CONFIG.portRange[0],
      keyPair: DHT.keyPair(Buffer.from(publicKey, "hex")),
    });
  }

  async start() {
    await this.dht.ready();
    console.log(`DHT NODE started  ${this.dht.address().port}`);

    this.setupDiscovery();
    this.startAnnouncing();
  }

  private setupDiscovery() {
    const discoveryStream = this.dht.lookup(this.topic, {
      lookup: true,
      announce: false,
    });

    discoveryStream.on("data", ({ value }) => {
      try {
        const peer = this.parsePeerInfo(value);
        if (peer.id === this.selfId) return;

        this.peers.set(peer.id, peer);
        this.callbacks?.onPeerDiscovered?.(peer);
      } catch (e) {
        console.error("discoveryStream faild:", e);
      }
    });

    discoveryStream.on("end", () => {
      console.log("discoveryStream over");
      this.setupDiscovery(); // 重新启动发现
    });
  }

  private startAnnouncing() {
    const announce = async () => {
      const selfInfo = this.getSelfInfo();
      await this.dht.announce(
        this.topic,
        Buffer.from(JSON.stringify(selfInfo))
      );
    };

    // 立即执行首次广播
    announce();
    // 设置定时广播
    this.announceInterval = setInterval(
      announce,
      KADEMLIA_CONFIG.announceInterval
    );
  }

  private getSelfInfo(): PeerInfo {
    return {
      id: this.selfId,
      address: this.dht.address().host,
      publicKey: this.publicKey,
      resources: self.resources, // 假设 Self 是单例
      lastSeen: Date.now(),
    };
  }

  private parsePeerInfo(data: Buffer): PeerInfo {
    const raw = JSON.parse(data.toString());
    return {
      id: raw.id,
      address: raw.address,
      publicKey: raw.publicKey,
      resources: {
        cpu: Number(raw.resources.cpu),
        ram: Number(raw.resources.ram),
        bandwidth: Number(raw.resources.bandwidth),
      },
      lastSeen: raw.lastSeen,
    };
  }

  async stop() {
    clearInterval(this.announceInterval);
    await this.dht.destroy();
  }

  getConnectedPeers(): PeerInfo[] {
    return Array.from(this.peers.values());
  }
}
