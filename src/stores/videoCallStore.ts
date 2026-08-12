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
/** How long an in-flight offer blocks a competing one from restarting negotiation. */
const OFFER_LOCK_MS = 1000;
/**
 * A roster entry older than this is treated as a ghost and never dialled. Well
 * clear of the 30s heartbeat so a throttled background tab is not mistaken for
 * one, and matches the server-side prune threshold.
 */
export const ROSTER_STALE_MS = 10 * 60 * 1000;

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
  // Glare guards: simple-peer renegotiates freely and the signalling queue can
  // replay, so the same SDP arriving twice must not restart negotiation.
  lastProcessedOffer?: string;
  lastProcessedAnswer?: string;
  processingOffer?: boolean;
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
  /** Whether the first roster snapshot has arrived. Empty is a real state. */
  rosterLoaded: boolean;
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

/**
 * Guards `initialize` against concurrent callers and against a `cleanup()` that
 * lands while it is still awaiting. Null means no call is being set up or held.
 */
let generationCounter = 0;
let activeGeneration: number | null = null;

export const useVideoCallStore = create<VideoCallState>((set, get) => ({
  localStream: null,
  peers: new Map(),
  iceServers: ICE_SERVERS,
  roster: [],
  rosterLoaded: false,
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
    // Three components can call this (VideoCallProvider, VideoSidebar,
    // VideoControls) and it awaits twice before `isInitialized` flips, so the
    // flag alone gates nothing. The generation token also catches a `cleanup()`
    // that lands mid-await, which would otherwise leave a listener and two
    // intervals running that nothing holds a handle to.
    if (get().isInitialized || activeGeneration !== null) {
      return;
    }

    const generation = ++generationCounter;
    activeGeneration = generation;
    const superseded = () => activeGeneration !== generation;

    set({ error: null });

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
    } catch (error) {
      const mediaError = createMediaError(error);
      logger.warn('[videocall] getUserMedia failed', mediaError.type, error);
      if (!superseded()) activeGeneration = null;
      set({ error: mediaError });
      return;
    }

    if (superseded()) {
      stopTracks(stream);
      return;
    }

    // Claiming the roster slot is a single RTDB write, and minting TURN
    // credentials requires it to exist first. A failure here is fatal to the
    // call — without a roster slot nobody can see this user — so it must not be
    // swallowed, and it must release the generation lock and the camera rather
    // than leaving both held with `isInitialized` false.
    try {
      await firebaseSignaling.claim(roomId, userId);
    } catch (error) {
      logger.error('[videocall] Could not claim a roster slot', error);
      stopTracks(stream);
      firebaseSignaling.cleanup();
      if (!superseded()) activeGeneration = null;
      set({ error: { type: 'Unknown', message: 'videoCall.errors.unknown' } });
      return;
    }

    if (superseded()) {
      stopTracks(stream);
      firebaseSignaling.cleanup();
      return;
    }

    // Open on the bundled relay. Minting credentials is a Cloud Function call
    // that cold-starts in seconds, and awaiting it here put that latency between
    // the user tapping the call button and seeing anything at all.
    set({
      localStream: stream,
      iceServers: ICE_SERVERS,
      isInitialized: true,
      isCallActive: true,
      roster: [],
      rosterLoaded: false,
      peerRetries: new Map(),
      roomId,
      userId,
    });

    const database = getDatabase();
    const usersRef = ref(database, `video-calls/${roomId}/users`);

    onValue(usersRef, (snapshot) => {
      const alreadyLoaded = get().rosterLoaded;
      set({ roster: liveRoster(snapshot.val()), rosterLoaded: true });
      get().reconcilePeers();

      // Bind signalling only once the roster is known. `onChildAdded` replays
      // every queued offer the instant it binds, and an offer accepted before
      // the roster loads is accepted from anyone — a stranger can leave one in
      // the queue and have it answered with the local camera and mic attached.
      // `claim()` already ran, so the first snapshot always contains this user.
      if (!alreadyLoaded && !superseded()) {
        firebaseSignaling.listen(handleSignal);
      }
    });

    set({
      heartbeatInterval: startHeartbeat(),
      reconcileInterval: window.setInterval(() => {
        get().reconcilePeers();
      }, RECONCILE_INTERVAL_MS),
    });

    // Upgrade to short-lived credentials in the background. Peers already dialled
    // keep the bundled relay; anything reconciled afterwards uses the minted set.
    resolveIceServers(roomId).then((iceServers) => {
      if (!superseded()) set({ iceServers });
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

    // A participant who exhausted their retries is no longer in `peers`, so the
    // loop above cannot reach them. Without this their spent budget outlives
    // their departure and they are never dialled again, even after rejoining.
    const staleRetries = [...get().peerRetries.keys()].filter((id) => !roster.includes(id));
    if (staleRetries.length > 0) {
      const nextRetries = new Map(get().peerRetries);
      staleRetries.forEach((id) => nextRetries.delete(id));
      set({ peerRetries: nextRetries });
    }

    const now = Date.now();
    const { peerRetries } = get();

    for (const otherUserId of roster) {
      const livePeers = get().peers;
      if (otherUserId === userId || livePeers.has(otherUserId)) continue;

      const retry = peerRetries.get(otherUserId);
      if (retry && retry.attempts >= MAX_RETRY_ATTEMPTS) continue;
      if (retry && retry.nextAttemptAt > now) continue;

      // Only live connections count toward the cap. Participants parked at their
      // retry ceiling hold no slot, or one unreachable user would starve the rest.
      if (livePeers.size >= MAX_PEERS) {
        logger.warn('[videocall] Peer limit reached, not dialling', otherUserId);
        break;
      }

      // Committed one at a time against freshly-read state: a peer that fails
      // during construction tears itself down through `dropPeer`, and a batched
      // write built before the loop would resurrect it with no retry booked.
      const connection = openPeer(otherUserId, userId < otherUserId, localStream, iceServers);
      set({ peers: new Map(get().peers).set(otherUserId, connection) });
    }
  },

  cleanup: () => {
    // Invalidates any `initialize` still awaiting, so it abandons its stream
    // rather than installing listeners and intervals after the teardown.
    activeGeneration = null;

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
      rosterLoaded: false,
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
    const { localStream, heartbeatInterval } = get();
    if (!localStream) return;

    stopTracks(localStream);

    // Hanging up gives the roster slot back. Signalling stays up so the call can
    // be resumed, but a hung-up participant that kept its slot would occupy one
    // of everyone else's four connections while sending nothing.
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
    firebaseSignaling.setPresent(false);

    set({
      localStream: null,
      heartbeatInterval: null,
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

    firebaseSignaling.setPresent(true);

    const { heartbeatInterval: existingHeartbeat } = get();
    if (existingHeartbeat) {
      clearInterval(existingHeartbeat);
    }

    set({
      peers: nextPeers,
      localStream: stream,
      heartbeatInterval: startHeartbeat(),
      isCallActive: true,
      isMuted: false,
      isVideoOff: false,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));

/**
 * Reduce a presence snapshot to participants worth dialling, freshest first.
 *
 * The roster cannot be taken at face value. Ghosts accumulate whenever a client
 * dies without its socket closing, and a room only needs four of them to consume
 * every mesh slot and lock real participants out entirely — observed in `/PUBLIC`
 * with nine dead entries. Server-side pruning is a backstop that runs every five
 * minutes at best; this makes the client immune in the meantime.
 *
 * Sorting matters as much as filtering: when more participants are present than
 * MAX_PEERS allows, the slots should go to whoever is most likely still there.
 */
export function liveRoster(users: unknown, now: number = Date.now()): string[] {
  if (!users || typeof users !== 'object') return [];

  return Object.entries(users as Record<string, { lastSeen?: unknown; joinedAt?: unknown }>)
    .map(([userId, presence]) => {
      const seen = presence?.lastSeen ?? presence?.joinedAt;
      // No usable timestamp means a presence node we cannot reason about; treat
      // it as expired rather than letting it hold a slot forever.
      return { userId, seen: typeof seen === 'number' ? seen : 0 };
    })
    .filter(({ seen }) => now - seen < ROSTER_STALE_MS)
    .sort((a, b) => b.seen - a.seen)
    .map(({ userId }) => userId);
}

function startHeartbeat(): number {
  return window.setInterval(() => {
    firebaseSignaling.heartbeat();
  }, HEARTBEAT_INTERVAL_MS);
}

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

/** simple-peer exposes no accessor for the underlying connection. */
function peerConnectionOf(peer: SimplePeer.Instance): RTCPeerConnection | undefined {
  return (peer as unknown as { _pc?: RTCPeerConnection })._pc;
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
  const pc = peerConnectionOf(peer);
  if (!pc?.getStats) return;

  try {
    const stats = await pc.getStats();

    // Several pairs can sit at `succeeded` while only one is nominated, and
    // `selected` is legacy Firefox. Taking the first match logs `host` for calls
    // that are actually relaying — inverting the one measurement worth having.
    let transportPairId: string | undefined;
    let nominated: any;
    let fallback: any;
    stats.forEach((report: any) => {
      if (report.type === 'transport' && report.selectedCandidatePairId) {
        transportPairId = report.selectedCandidatePairId;
      } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        if (report.nominated || report.selected) nominated ??= report;
        fallback ??= report;
      }
    });

    const selected = (transportPairId && stats.get(transportPairId)) || nominated || fallback;
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

    // A renegotiation can leave a superseded video track decoding in the background.
    const videoTracks = remoteStream.getVideoTracks();
    if (videoTracks.length > 1) {
      videoTracks.slice(1).forEach((track) => track.stop());
    }

    const nextPeers = new Map(peers);
    nextPeers.set(targetUserId, { ...peerData, stream: remoteStream });
    useVideoCallStore.setState({ peers: nextPeers });
  });

  const onConnected = () => {
    clearTimeout(connectionTimeout);
    clearRetries(targetUserId);
    logSelectedCandidatePair(peer, targetUserId);
  };

  const onLost = (reason: string, detail?: unknown) => {
    logger.warn('[videocall] Peer lost', targetUserId, reason, detail);
    clearTimeout(connectionTimeout);
    dropPeer(targetUserId, { retry: true });
  };

  peer.on('error', (error) => onLost('error', error));
  peer.on('close', () => onLost('closed'));
  peer.on('connect', onConnected);

  const connectionTimeout = setTimeout(() => {
    if (!peer.destroyed) onLost('never connected');
  }, CONNECT_TIMEOUT_MS);

  peer.on('iceStateChange', (iceConnectionState: string) => {
    logger.debug('[videocall] ICE state', targetUserId, iceConnectionState);

    if (iceConnectionState === 'connected' || iceConnectionState === 'completed') {
      onConnected();
    } else if (iceConnectionState === 'failed') {
      onLost('ICE failed');
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
      // Signalling rules let any authenticated user push an offer into anyone's
      // queue, and `from` is client-supplied, so cap peer construction. The
      // roster check waits for the first snapshot rather than for a non-empty
      // one: RTDB delivers asynchronously and rejecting during that window
      // discards a legitimate offer the sender will not resend until its 30s
      // timeout, but "empty" is a real state a throttled tab can reach, and
      // keying on it would quietly reopen the gate.
      const { roster, rosterLoaded } = useVideoCallStore.getState();
      if (peers.size >= MAX_PEERS || (rosterLoaded && !roster.includes(data.from))) {
        logger.warn('[videocall] Ignoring unexpected offer', data.from);
        return;
      }

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
      if (peerConnection.processingOffer) {
        return;
      }
      if (peerConnection.lastProcessedOffer === data.sdp) {
        return;
      }

      const iceConnectionState = peerConnectionOf(peerConnection.peer)?.iceConnectionState;
      if (
        iceConnectionState === 'checking' ||
        iceConnectionState === 'connected' ||
        iceConnectionState === 'completed'
      ) {
        return;
      }
      if (
        iceConnectionState !== 'new' &&
        iceConnectionState !== 'disconnected' &&
        iceConnectionState !== 'failed' &&
        iceConnectionState !== undefined
      ) {
        return;
      }
      peerConnection.processingOffer = true;
      peerConnection.lastProcessedOffer = data.sdp;
      const nextPeers = new Map(peers);
      nextPeers.set(data.from, peerConnection);
      useVideoCallStore.setState({ peers: nextPeers });

      try {
        peerConnection.peer.signal({ type: 'offer', sdp: data.sdp });
        setTimeout(() => {
          const current = useVideoCallStore.getState().peers;
          const entry = current.get(data.from);
          if (entry) {
            const released = new Map(current);
            released.set(data.from, { ...entry, processingOffer: false });
            useVideoCallStore.setState({ peers: released });
          }
        }, OFFER_LOCK_MS);
      } catch (error) {
        logger.warn('[videocall] Failed to apply offer', data.from, error);
        const released = new Map(useVideoCallStore.getState().peers);
        released.set(data.from, { ...peerConnection, processingOffer: false });
        useVideoCallStore.setState({ peers: released });
      }
    }
  } else if (data.type === 'answer' && data.sdp && peerConnection) {
    if (peerConnection.initiator && !peerConnection.peer.destroyed) {
      if (peerConnection.lastProcessedAnswer === data.sdp) {
        return;
      }

      const iceConnectionState = peerConnectionOf(peerConnection.peer)?.iceConnectionState;
      if (iceConnectionState === 'connected' || iceConnectionState === 'completed') {
        return;
      }
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
