import { create } from 'zustand';
import SimplePeer from 'simple-peer';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { firebaseSignaling, SignalData } from '@/services/firebaseSignaling';
import { ICE_SERVERS } from '@/config/webrtc';

export interface PeerConnection {
  peer: SimplePeer.Instance;
  stream: MediaStream;
  initiator: boolean;
  lastProcessedOffer?: string; // Track last offer SDP to prevent duplicates
  lastProcessedAnswer?: string; // Track last answer SDP to prevent duplicates
  processingOffer?: boolean; // Lock to prevent concurrent offer processing
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
  roomId: string | null;
  userId: string | null;

  initialize: (roomId: string, userId: string) => Promise<void>;
  cleanup: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  handleVisibilityChange: (isHidden: boolean) => void;
  disconnectCall: () => void;
  reconnectCall: () => Promise<void>;
}

export const useVideoCallStore = create<VideoCallState>((set, get) => ({
  localStream: null,
  peers: new Map(),
  isMuted: false,
  isVideoOff: false,
  isInitialized: false,
  isCallActive: false,
  heartbeatInterval: null,
  cleanupInterval: null,
  roomId: null,
  userId: null,

  initialize: async (roomId: string, userId: string) => {
    const { isInitialized } = get();
    if (isInitialized) {
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 24, max: 30 },
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const createPeerConnection = (
      targetUserId: string,
      initiator: boolean
    ): SimplePeer.Instance => {
      const peer = new SimplePeer({
        initiator,
        stream,
        trickle: true,
        config: {
          iceServers: ICE_SERVERS,
          bundlePolicy: 'max-bundle',
          rtcpMuxPolicy: 'require',
          iceCandidatePoolSize: 0,
        },
        offerOptions: {
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        },
        answerOptions: {
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        },
      });

      peer.on('signal', async (signal) => {
        if (signal.type === 'offer') {
          await firebaseSignaling.sendOffer(targetUserId, signal);
        } else if (signal.type === 'answer') {
          await firebaseSignaling.sendAnswer(targetUserId, signal);
        } else if ('candidate' in signal && signal.candidate) {
          await firebaseSignaling.sendIceCandidate(targetUserId, signal.candidate);
        }
      });

      peer.on('stream', (remoteStream) => {
        const { peers } = get();
        const peerData = peers.get(targetUserId);
        if (peerData) {
          // Stop old stream tracks before replacing
          if (peerData.stream && peerData.stream !== remoteStream) {
            peerData.stream.getTracks().forEach((track) => {
              track.stop();
              track.enabled = false;
            });
          }

          // Limit video tracks to reduce memory usage
          const videoTracks = remoteStream.getVideoTracks();
          if (videoTracks.length > 1) {
            videoTracks.slice(1).forEach((track) => track.stop());
          }

          // Create a new PeerConnection object with the new stream (immutable update)
          const newPeerData = {
            ...peerData,
            stream: remoteStream,
          };

          const newPeers = new Map(peers);
          newPeers.set(targetUserId, newPeerData);

          set({ peers: newPeers });
        }
      });

      peer.on('error', () => {
        // Clean up on error
        const { peers } = get();
        const peerData = peers.get(targetUserId);
        if (peerData) {
          peerData.stream?.getTracks().forEach((track) => {
            track.stop();
            track.enabled = false;
          });
          if (!peerData.peer.destroyed) {
            peerData.peer.destroy();
          }
          const newPeers = new Map(peers);
          newPeers.delete(targetUserId);
          set({ peers: newPeers });
        }
      });

      peer.on('close', () => {
        const { peers } = get();
        const peerData = peers.get(targetUserId);
        if (peerData) {
          peerData.stream?.getTracks().forEach((track) => {
            track.stop();
            track.enabled = false;
          });
          if (!peerData.peer.destroyed) {
            peerData.peer.destroy();
          }
          const newPeers = new Map(peers);
          newPeers.delete(targetUserId);
          set({ peers: newPeers });
        }
      });

      peer.on('connect', () => {});

      // Set timeout to destroy connection if it doesn't connect within 30 seconds
      const connectionTimeout = setTimeout(() => {
        if (!peer.destroyed) {
          const { peers } = get();
          const peerData = peers.get(targetUserId);
          if (peerData) {
            peerData.stream?.getTracks().forEach((track) => {
              track.stop();
              track.enabled = false;
            });
            peerData.peer.destroy();
            const newPeers = new Map(peers);
            newPeers.delete(targetUserId);
            set({ peers: newPeers });
          }
        }
      }, 30000);

      peer.on('iceStateChange', (iceConnectionState: string) => {
        if (iceConnectionState === 'connected' || iceConnectionState === 'completed') {
          clearTimeout(connectionTimeout);
        } else if (iceConnectionState === 'failed') {
          clearTimeout(connectionTimeout);

          // Clean up failed connection
          const { peers } = get();
          const peerData = peers.get(targetUserId);
          if (peerData && !peerData.peer.destroyed) {
            peerData.stream?.getTracks().forEach((track) => {
              track.stop();
              track.enabled = false;
            });
            peerData.peer.destroy();
            const newPeers = new Map(peers);
            newPeers.delete(targetUserId);
            set({ peers: newPeers });
          }
        }
      });

      return peer;
    };

    const handleSignal = (data: SignalData) => {
      const { peers, userId: currentUserId } = get();
      if (data.from === currentUserId) {
        return;
      }

      let peerConnection = peers.get(data.from);

      if (data.type === 'offer' && data.sdp) {
        if (!peerConnection) {
          const peer = createPeerConnection(data.from, false);
          peerConnection = {
            peer,
            stream: new MediaStream(),
            initiator: false,
            lastProcessedOffer: data.sdp,
          };
          peers.set(data.from, peerConnection);
          set({ peers: new Map(peers) });

          setTimeout(() => {
            if (!peerConnection!.peer.destroyed) {
              try {
                peerConnection!.peer.signal({ type: 'offer', sdp: data.sdp });
              } catch {
                // Silently handle signal errors
              }
            }
          }, 100);
        } else if (!peerConnection.initiator && !peerConnection.peer.destroyed) {
          // Check if we're already processing an offer
          if (peerConnection.processingOffer) {
            return;
          }

          // Check if this is the exact same offer we already processed
          if (peerConnection.lastProcessedOffer === data.sdp) {
            return;
          }

          const pc = (peerConnection.peer as any)._pc;
          const iceConnectionState = pc?.iceConnectionState;

          // Ignore offers if we're actively connecting or already connected
          if (
            iceConnectionState === 'checking' ||
            iceConnectionState === 'connected' ||
            iceConnectionState === 'completed'
          ) {
            return;
          }

          // Only accept offers if connection is new, disconnected, or failed
          if (
            iceConnectionState !== 'new' &&
            iceConnectionState !== 'disconnected' &&
            iceConnectionState !== 'failed' &&
            iceConnectionState !== undefined
          ) {
            return;
          }

          // Set processing lock
          peerConnection.processingOffer = true;
          peerConnection.lastProcessedOffer = data.sdp;
          const newPeers = new Map(peers);
          newPeers.set(data.from, peerConnection);
          set({ peers: newPeers });

          try {
            peerConnection.peer.signal({ type: 'offer', sdp: data.sdp });

            // Release lock after a short delay to allow processing
            setTimeout(() => {
              const { peers } = get();
              const peer = peers.get(data.from);
              if (peer) {
                peer.processingOffer = false;
                const updated = new Map(peers);
                updated.set(data.from, peer);
                set({ peers: updated });
              }
            }, 1000); // 1 second lock
          } catch {
            // Release lock on error
            peerConnection.processingOffer = false;
            const errorPeers = new Map(peers);
            errorPeers.set(data.from, peerConnection);
            set({ peers: errorPeers });
          }
        }
      } else if (data.type === 'answer' && data.sdp && peerConnection) {
        if (peerConnection.initiator && !peerConnection.peer.destroyed) {
          // Check if this is the exact same answer we already processed
          if (peerConnection.lastProcessedAnswer === data.sdp) {
            return;
          }

          const pc = (peerConnection.peer as any)._pc;
          const iceConnectionState = pc?.iceConnectionState;

          // Ignore answers if we're already connected
          if (iceConnectionState === 'connected' || iceConnectionState === 'completed') {
            return;
          }

          // Store this answer as processed before signaling
          peerConnection.lastProcessedAnswer = data.sdp;
          const newPeers = new Map(peers);
          newPeers.set(data.from, peerConnection);
          set({ peers: newPeers });

          try {
            peerConnection.peer.signal({ type: 'answer', sdp: data.sdp });
          } catch {
            // Silently handle signal errors
          }
        }
      } else if (data.type === 'ice-candidate' && data.candidate && peerConnection) {
        setTimeout(() => {
          if (peerConnection && !peerConnection.peer.destroyed) {
            peerConnection.peer.signal({
              type: 'candidate' as const,
              candidate: data.candidate as unknown as RTCIceCandidate,
            });
          }
        }, 50);
      }
    };

    firebaseSignaling.initialize(roomId, userId, handleSignal);

    const database = getDatabase();
    const usersRef = ref(database, `video-calls/${roomId}/users`);

    let lastUserIds: string[] = [];

    onValue(usersRef, (snapshot) => {
      const users = snapshot.val();
      if (!users) return;

      const { peers, userId: currentUserId } = get();
      const userIds = Object.keys(users);

      const userIdsChanged =
        userIds.length !== lastUserIds.length || !userIds.every((id) => lastUserIds.includes(id));

      if (!userIdsChanged) {
        return;
      }

      lastUserIds = userIds;

      // Limit maximum connections to prevent browser crashes
      const MAX_PEERS = 4;

      // Clean up disconnected peers first
      peers.forEach((peerData, peerId) => {
        if (peerData.peer.destroyed || !userIds.includes(peerId)) {
          if (!peerData.peer.destroyed) {
            peerData.peer.destroy();
          }
          peerData.stream?.getTracks().forEach((track) => {
            track.stop();
            track.enabled = false;
          });
          peers.delete(peerId);
        }
      });

      userIds.forEach((otherUserId) => {
        if (otherUserId !== currentUserId && !peers.has(otherUserId)) {
          if (peers.size >= MAX_PEERS) {
            return;
          }

          const shouldInitiate = currentUserId! < otherUserId;
          const peer = createPeerConnection(otherUserId, shouldInitiate);
          peers.set(otherUserId, {
            peer,
            stream: new MediaStream(),
            initiator: shouldInitiate,
          });
        }
      });

      set({ peers: new Map(peers) });
    });

    set({
      localStream: stream,
      isInitialized: true,
      isCallActive: true,
      heartbeatInterval: null,
      cleanupInterval: null,
      roomId,
      userId,
    });
  },

  cleanup: () => {
    const { localStream, peers, heartbeatInterval, cleanupInterval, roomId } = get();

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
    }

    peers.forEach((peerData) => {
      if (!peerData.peer.destroyed) {
        peerData.peer.destroy();
      }
      peerData.stream?.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
    });

    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }

    if (cleanupInterval) {
      clearInterval(cleanupInterval);
    }

    if (roomId) {
      const database = getDatabase();
      const usersRef = ref(database, `video-calls/${roomId}/users`);
      off(usersRef);
    }

    firebaseSignaling.cleanup();

    set({
      localStream: null,
      peers: new Map(),
      isInitialized: false,
      isCallActive: false,
      heartbeatInterval: null,
      cleanupInterval: null,
      roomId: null,
      userId: null,
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

    localStream.getTracks().forEach((track) => {
      track.stop();
      track.enabled = false;
    });

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
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 24, max: 30 },
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    set({
      localStream: stream,
      isCallActive: true,
      isMuted: false,
      isVideoOff: false,
    });
  },
}));
