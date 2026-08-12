import { create } from 'zustand';
import SimplePeer from 'simple-peer';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { firebaseSignaling, SignalData } from '@/services/firebaseSignaling';
import { ICE_SERVERS, IceServer, MAX_PEERS } from '@/config/webrtc';
import { resolveIceServers } from '@/services/iceServers';
import { logger } from '@/utils/logger';

/** How often the peer map is reconciled against the room roster. */
export const RECONCILE_INTERVAL_MS = 3000;
/** How often presence is refreshed so the server-side prune leaves live callers alone. */
export const HEARTBEAT_INTERVAL_MS = 30_000;
/** A peer that has not reached `connected` by now is torn down and retried. */
export const CONNECT_TIMEOUT_MS = 30_000;
/** Retries per participant before we stop dialling them. */
export const MAX_RETRY_ATTEMPTS = 5;
const RETRY_BASE_MS = 4000;
export const RETRY_MAX_MS = 15_000;

const MEDIA_CONSTRAINTS: MediaStreamConstraints = {
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
};

const createMediaError = (
  error: unknown
): {
  type:
    'NotAllowedError' | 'NotFoundError' | 'NotReadableError' | 'OverconstrainedError' | 'Unknown';
  message: string;
} => {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
        return {
          type: 'NotAllowedError',
          message: 'videoCall.errors.permissionDenied',
        };
      case 'NotFoundError':
        return {
          type: 'NotFoundError',
          message: 'videoCall.errors.deviceNotFound',
        };
      case 'NotReadableError':
        return {
          type: 'NotReadableError',
          message: 'videoCall.errors.deviceInUse',
        };
      case 'OverconstrainedError':
        return {
          type: 'OverconstrainedError',
          message: 'videoCall.errors.constraintsNotSatisfied',
        };
      default:
        return {
          type: 'Unknown',
          message: 'videoCall.errors.unknown',
        };
    }
  }
  return {
    type: 'Unknown',
    message: 'videoCall.errors.unknown',
  };
};

export interface PeerConnection {
  peer: SimplePeer.Instance;
  stream: MediaStream;
  initiator: boolean;
  /**
   * The local stream handed to simple-peer at construction. It keys the internal
   * sender map, so every later `replaceTrack` has to pass this exact object even
   * after the tracks on it have been swapped out.
   */
  senderStream: MediaStream;
  /** The local tracks currently attached to this peer's senders. */
  senderTracks: MediaStreamTrack[];
  lastProcessedOffer?: string; // Track last offer SDP to prevent duplicates
  lastProcessedAnswer?: string; // Track last answer SDP to prevent duplicates
  processingOffer?: boolean; // Lock to prevent concurrent offer processing
}

export interface RetryState {
  attempts: number;
  nextAttemptAt: number;
}

export interface VideoCallError {
  type:
    'NotAllowedError' | 'NotFoundError' | 'NotReadableError' | 'OverconstrainedError' | 'Unknown';
  message: string;
}

export interface VideoCallState {
  localStream: MediaStream | null;
  peers: Map<string, PeerConnection>;
  /** Resolved once per call; short-lived relay credentials when the backend mints them. */
  iceServers: IceServer[];
  /** User ids the signalling roster currently reports as present in the room. */
  roster: string[];
  peerRetries: Map<string, RetryState>;
  isMuted: boolean;
  isVideoOff: boolean;
  isInitialized: boolean;
  isCallActive: boolean;
  heartbeatInterval: number | null;
  reconcileInterval: number | null;
  roomId: string | null;
  userId: string | null;
  error: VideoCallError | null;

  initialize: (roomId: string, userId: string) => Promise<void>;
  cleanup: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  handleVisibilityChange: (isHidden: boolean) => void;
  disconnectCall: () => void;
  reconnectCall: () => Promise<void>;
  clearError: () => void;
  /**
   * Bring the peer map in line with the roster: drop departed or dead peers, then
   * dial anyone still expected who has no live connection. Runs on every roster
   * update and on a timer, because a peer dying does not change the roster — which
   * is exactly how a single ICE failure used to become a permanent "I only see
   * myself" until the page was reloaded.
   */
  reconcilePeers: () => void;
}

export const useVideoCallStore = create<VideoCallState>((set, get) => ({
  localStream: null,
  peers: new Map(),
  iceServers: ICE_SERVERS,
  roster: [],
  peerRetries: new Map(),
  isMuted: false,
  isVideoOff: false,
  isInitialized: false,
  isCallActive: false,
  heartbeatInterval: null,
  reconcileInterval: null,
  roomId: null,
  userId: null,
  error: null,

  initialize: async (roomId: string, userId: string) => {
    const { isInitialized } = get();
    if (isInitialized) {
      return;
    }

    set({ error: null });

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
    } catch (error) {
      const mediaError = createMediaError(error);
      logger.warn('[videocall] getUserMedia failed', mediaError.type, error);
      set({ error: mediaError });
      return;
    }

    set({
      localStream: stream,
      iceServers: await resolveIceServers(),
      isInitialized: true,
      isCallActive: true,
      roster: [],
      peerRetries: new Map(),
      roomId,
      userId,
    });

    firebaseSignaling.initialize(roomId, userId, handleSignal);

    const database = getDatabase();
    const usersRef = ref(database, `video-calls/${roomId}/users`);

    onValue(usersRef, (snapshot) => {
      const users = snapshot.val();
      set({ roster: users ? Object.keys(users) : [] });
      get().reconcilePeers();
    });

    set({
      heartbeatInterval: window.setInterval(() => {
        firebaseSignaling.heartbeat();
      }, HEARTBEAT_INTERVAL_MS),
      reconcileInterval: window.setInterval(() => {
        get().reconcilePeers();
      }, RECONCILE_INTERVAL_MS),
    });
  },

  reconcilePeers: () => {
    const { isInitialized, userId, localStream } = get();
    if (!isInitialized || !userId || !localStream) return;

    const { roster, peers, iceServers } = get();

    // Prune first, so departed participants release their MAX_PEERS slot before
    // we decide who still needs dialling.
    peers.forEach((peerData, peerId) => {
      if (!roster.includes(peerId)) {
        logger.debug('[videocall] Peer left the room', peerId);
        dropPeer(peerId, { retry: false });
      } else if (peerData.peer.destroyed) {
        dropPeer(peerId, { retry: true });
      }
    });

    const now = Date.now();
    const { peers: livePeers, peerRetries } = get();
    const nextPeers = new Map(livePeers);

    for (const otherUserId of roster) {
      if (otherUserId === userId || nextPeers.has(otherUserId)) continue;

      const retry = peerRetries.get(otherUserId);
      if (retry && retry.attempts >= MAX_RETRY_ATTEMPTS) continue;
      if (retry && retry.nextAttemptAt > now) continue;

      // Only live connections count toward the cap. Participants parked at their
      // retry ceiling hold no slot, or one unreachable user would starve the rest.
      if (nextPeers.size >= MAX_PEERS) {
        logger.warn('[videocall] Peer limit reached, not dialling', otherUserId);
        break;
      }

      nextPeers.set(
        otherUserId,
        openPeer(otherUserId, userId < otherUserId, localStream, iceServers)
      );
    }

    if (nextPeers.size !== livePeers.size) {
      set({ peers: nextPeers });
    }
  },

  cleanup: () => {
    const { localStream, peers, heartbeatInterval, reconcileInterval, roomId } = get();

    if (localStream) {
      stopTracks(localStream);
    }

    peers.forEach((peerData) => {
      if (!peerData.peer.destroyed) {
        peerData.peer.destroy();
      }
      stopTracks(peerData.stream);
    });

    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }

    if (reconcileInterval) {
      clearInterval(reconcileInterval);
    }

    if (roomId) {
      const database = getDatabase();
      off(ref(database, `video-calls/${roomId}/users`));
    }

    firebaseSignaling.cleanup();

    set({
      localStream: null,
      peers: new Map(),
      roster: [],
      peerRetries: new Map(),
      isInitialized: false,
      isCallActive: false,
      heartbeatInterval: null,
      reconcileInterval: null,
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

    stopTracks(localStream);

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

    set({ error: null });

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
    } catch (error) {
      const mediaError = createMediaError(error);
      logger.warn('[videocall] getUserMedia failed on reconnect', mediaError.type, error);
      set({ error: mediaError });
      return;
    }

    // Peers survived the hang-up holding senders for tracks we stopped. Swapping
    // the fresh tracks in is what makes the far side see video again; without it
    // they keep receiving dead media and we render only our own preview.
    const nextPeers = new Map(get().peers);
    nextPeers.forEach((peerData, peerId) => {
      if (peerData.peer.destroyed) return;

      const attached: MediaStreamTrack[] = [];
      stream.getTracks().forEach((track) => {
        const previous = peerData.senderTracks.find((candidate) => candidate.kind === track.kind);
        try {
          if (previous) {
            peerData.peer.replaceTrack(previous, track, peerData.senderStream);
          } else {
            peerData.peer.addTrack(track, peerData.senderStream);
          }
          attached.push(track);
        } catch (error) {
          logger.warn('[videocall] Failed to attach fresh track to peer', peerId, error);
        }
      });

      nextPeers.set(peerId, { ...peerData, senderTracks: attached });
    });

    set({
      peers: nextPeers,
      localStream: stream,
      isCallActive: true,
      isMuted: false,
      isVideoOff: false,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));

function stopTracks(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((track) => {
    track.stop();
    track.enabled = false;
  });
}

function retryDelay(attempts: number): number {
  return Math.min(RETRY_BASE_MS * 2 ** attempts, RETRY_MAX_MS);
}

/**
 * Tear a peer down and remove it from the map. `retry: true` schedules another
 * attempt with backoff; `retry: false` is for participants who genuinely left.
 */
function dropPeer(targetUserId: string, { retry }: { retry: boolean }): void {
  const { peers, peerRetries } = useVideoCallStore.getState();
  const peerData = peers.get(targetUserId);
  if (!peerData) return;

  const nextPeers = new Map(peers);
  nextPeers.delete(targetUserId);

  const nextRetries = new Map(peerRetries);
  if (retry) {
    const attempts = (nextRetries.get(targetUserId)?.attempts ?? 0) + 1;
    nextRetries.set(targetUserId, {
      attempts,
      nextAttemptAt: Date.now() + retryDelay(attempts - 1),
    });
  } else {
    nextRetries.delete(targetUserId);
  }

  // Remove from state before destroying: destroy re-enters through the peer's own
  // 'close' handler, which would otherwise book a second retry for one failure.
  useVideoCallStore.setState({ peers: nextPeers, peerRetries: nextRetries });

  stopTracks(peerData.stream);
  if (!peerData.peer.destroyed) {
    peerData.peer.destroy();
  }
}

function clearRetries(targetUserId: string): void {
  const { peerRetries } = useVideoCallStore.getState();
  if (!peerRetries.has(targetUserId)) return;

  const nextRetries = new Map(peerRetries);
  nextRetries.delete(targetUserId);
  useVideoCallStore.setState({ peerRetries: nextRetries });
}

/**
 * Report which candidate types actually carried the connection. `relay` on either
 * end means TURN did the work — the one measurement that says whether relay
 * capacity is the reason a user cannot see anyone.
 */
async function logSelectedCandidatePair(
  peer: SimplePeer.Instance,
  targetUserId: string
): Promise<void> {
  const pc = (peer as unknown as { _pc?: RTCPeerConnection })._pc;
  if (!pc?.getStats) return;

  try {
    const stats = await pc.getStats();
    let selected: any;
    stats.forEach((report: any) => {
      if (selected) return;
      if (report.type === 'candidate-pair' && (report.selected || report.state === 'succeeded')) {
        selected = report;
      }
    });
    if (!selected) return;

    logger.info('[videocall] Connected', targetUserId, {
      local: stats.get(selected.localCandidateId)?.candidateType,
      remote: stats.get(selected.remoteCandidateId)?.candidateType,
    });
  } catch (error) {
    logger.debug('[videocall] Could not read connection stats', targetUserId, error);
  }
}

function openPeer(
  targetUserId: string,
  initiator: boolean,
  localStream: MediaStream,
  iceServers: IceServer[]
): PeerConnection {
  const peer = new SimplePeer({
    initiator,
    stream: localStream,
    trickle: true,
    config: {
      iceServers,
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
    try {
      if (signal.type === 'offer') {
        await firebaseSignaling.sendOffer(targetUserId, signal);
      } else if (signal.type === 'answer') {
        await firebaseSignaling.sendAnswer(targetUserId, signal);
      } else if ('candidate' in signal && signal.candidate) {
        await firebaseSignaling.sendIceCandidate(targetUserId, signal.candidate);
      }
    } catch (error) {
      logger.warn('[videocall] Failed to publish signal', targetUserId, error);
    }
  });

  peer.on('stream', (remoteStream) => {
    const { peers } = useVideoCallStore.getState();
    const peerData = peers.get(targetUserId);
    if (!peerData) return;

    if (peerData.stream && peerData.stream !== remoteStream) {
      stopTracks(peerData.stream);
    }

    // Limit video tracks to reduce memory usage
    const videoTracks = remoteStream.getVideoTracks();
    if (videoTracks.length > 1) {
      videoTracks.slice(1).forEach((track) => track.stop());
    }

    const nextPeers = new Map(peers);
    nextPeers.set(targetUserId, { ...peerData, stream: remoteStream });
    useVideoCallStore.setState({ peers: nextPeers });
  });

  peer.on('error', (error) => {
    logger.warn('[videocall] Peer error', targetUserId, error);
    clearTimeout(connectionTimeout);
    dropPeer(targetUserId, { retry: true });
  });

  peer.on('close', () => {
    logger.debug('[videocall] Peer closed', targetUserId);
    clearTimeout(connectionTimeout);
    dropPeer(targetUserId, { retry: true });
  });

  peer.on('connect', () => {
    clearTimeout(connectionTimeout);
    clearRetries(targetUserId);
    logSelectedCandidatePair(peer, targetUserId);
  });

  const connectionTimeout = setTimeout(() => {
    if (!peer.destroyed) {
      logger.warn('[videocall] Peer never connected, retrying', targetUserId);
      dropPeer(targetUserId, { retry: true });
    }
  }, CONNECT_TIMEOUT_MS);

  peer.on('iceStateChange', (iceConnectionState: string) => {
    logger.debug('[videocall] ICE state', targetUserId, iceConnectionState);

    if (iceConnectionState === 'connected' || iceConnectionState === 'completed') {
      clearTimeout(connectionTimeout);
      clearRetries(targetUserId);
      logSelectedCandidatePair(peer, targetUserId);
    } else if (iceConnectionState === 'failed') {
      clearTimeout(connectionTimeout);
      dropPeer(targetUserId, { retry: true });
    }
  });

  return {
    peer,
    stream: new MediaStream(),
    initiator,
    senderStream: localStream,
    senderTracks: localStream.getTracks(),
  };
}

function handleSignal(data: SignalData): void {
  const { peers, userId: currentUserId, localStream, iceServers } = useVideoCallStore.getState();
  if (data.from === currentUserId || !localStream) {
    return;
  }

  let peerConnection = peers.get(data.from);

  if (data.type === 'offer' && data.sdp) {
    if (!peerConnection) {
      peerConnection = {
        ...openPeer(data.from, false, localStream, iceServers),
        lastProcessedOffer: data.sdp,
      };
      const nextPeers = new Map(peers);
      nextPeers.set(data.from, peerConnection);
      useVideoCallStore.setState({ peers: nextPeers });

      setTimeout(() => {
        if (!peerConnection!.peer.destroyed) {
          try {
            peerConnection!.peer.signal({ type: 'offer', sdp: data.sdp });
          } catch (error) {
            logger.warn('[videocall] Failed to apply offer', data.from, error);
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
      const nextPeers = new Map(peers);
      nextPeers.set(data.from, peerConnection);
      useVideoCallStore.setState({ peers: nextPeers });

      try {
        peerConnection.peer.signal({ type: 'offer', sdp: data.sdp });

        // Release lock after a short delay to allow processing
        setTimeout(() => {
          const current = useVideoCallStore.getState().peers;
          const entry = current.get(data.from);
          if (entry) {
            const released = new Map(current);
            released.set(data.from, { ...entry, processingOffer: false });
            useVideoCallStore.setState({ peers: released });
          }
        }, 1000); // 1 second lock
      } catch (error) {
        logger.warn('[videocall] Failed to apply offer', data.from, error);
        const released = new Map(useVideoCallStore.getState().peers);
        released.set(data.from, { ...peerConnection, processingOffer: false });
        useVideoCallStore.setState({ peers: released });
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
      const nextPeers = new Map(peers);
      nextPeers.set(data.from, peerConnection);
      useVideoCallStore.setState({ peers: nextPeers });

      try {
        peerConnection.peer.signal({ type: 'answer', sdp: data.sdp });
      } catch (error) {
        logger.warn('[videocall] Failed to apply answer', data.from, error);
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
}
