export interface PeerInfo {
  id: string;
  address: string;
  publicKey: string;
  lastSeen: number;
}

export interface NetworkCallbacks {
  onPeerDiscovered?: (peer: PeerInfo) => void;
  onPeerLost?: (peerId: string) => void;
}
