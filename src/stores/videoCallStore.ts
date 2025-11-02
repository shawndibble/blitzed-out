import { create } from 'zustand';
import SimplePeer from 'simple-peer';

export interface PeerConnection {
  peer: SimplePeer.Instance;
  stream: MediaStream;
}

export interface VideoCallState {
  localStream: MediaStream | null;
  peers: Map<string, PeerConnection>;
  isMuted: boolean;
  isVideoOff: boolean;
  isInitialized: boolean;
  isCallActive: boolean;
  heartbeatInterval: number | null;
  cleanupInterval: number | null;

  initialize: (roomId: string) => Promise<void>;
  cleanup: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  handleVisibilityChange: (isHidden: boolean) => void;
  disconnectCall: () => void;
  reconnectCall: () => Promise<void>;
}

const HEARTBEAT_INTERVAL = 30000;
const CLEANUP_INTERVAL = 30 * 60 * 1000;

export const useVideoCallStore = create<VideoCallState>((set, get) => ({
  localStream: null,
  peers: new Map(),
  isMuted: false,
  isVideoOff: false,
  isInitialized: false,
  isCallActive: false,
  heartbeatInterval: null,
  cleanupInterval: null,

  initialize: async (_roomId: string) => {
    // Prevent re-initialization if already initialized
    const { isInitialized } = get();
    if (isInitialized) {
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    const heartbeat = window.setInterval(() => {
      const { peers } = get();
      peers.forEach((_peerData, _peerId) => {});
    }, HEARTBEAT_INTERVAL);

    const cleanup = window.setInterval(() => {
      const { peers } = get();
      peers.forEach((peerData, peerId) => {
        if (peerData.peer.destroyed) {
          peers.delete(peerId);
          peerData.stream?.getTracks().forEach((track) => track.stop());
        }
      });
      set({ peers: new Map(peers) });
    }, CLEANUP_INTERVAL);

    set({
      localStream: stream,
      isInitialized: true,
      isCallActive: true,
      heartbeatInterval: heartbeat,
      cleanupInterval: cleanup,
    });
  },

  cleanup: () => {
    const { localStream, peers, heartbeatInterval, cleanupInterval } = get();

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    peers.forEach((peerData) => {
      if (!peerData.peer.destroyed) {
        peerData.peer.destroy();
      }
      peerData.stream?.getTracks().forEach((track) => track.stop());
    });

    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }

    if (cleanupInterval) {
      clearInterval(cleanupInterval);
    }

    set({
      localStream: null,
      peers: new Map(),
      isInitialized: false,
      isCallActive: false,
      heartbeatInterval: null,
      cleanupInterval: null,
    });
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (!localStream) return;

    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      const newMutedState = !isMuted;
      audioTrack.enabled = !newMutedState;
      set({ isMuted: newMutedState });
    }
  },

  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    if (!localStream) return;

    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      const newVideoOffState = !isVideoOff;
      videoTrack.enabled = !newVideoOffState;
      set({ isVideoOff: newVideoOffState });
    }
  },

  handleVisibilityChange: (isHidden: boolean) => {
    const { localStream, isVideoOff } = get();
    if (!localStream) return;

    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      if (isHidden) {
        videoTrack.enabled = false;
      } else if (!isVideoOff) {
        videoTrack.enabled = true;
      }
    }
  },

  disconnectCall: () => {
    const { localStream } = get();
    if (!localStream) return;

    localStream.getTracks().forEach((track) => track.stop());

    set({
      localStream: null,
      isCallActive: false,
      isMuted: false,
      isVideoOff: false,
    });
  },

  reconnectCall: async () => {
    const { isInitialized } = get();
    if (!isInitialized) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    set({
      localStream: stream,
      isCallActive: true,
      isMuted: false,
      isVideoOff: false,
    });
  },
}));
