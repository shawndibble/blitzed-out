import { create } from 'zustand';
import { getDatabase, ref, onValue } from 'firebase/database';
import { firebaseSignaling, SignalData } from '@/services/firebaseSignaling';
import {
  ICE_SERVERS,
  IceServer,
  LINK_GRACE_MS,
  MAX_CALL_PARTICIPANTS,
  MAX_PEERS,
} from '@/config/webrtc';
import { resolveIceServers } from '@/services/iceServers';
import { liveRoster, rosterMediaStates } from '@/services/callRoster';
import { useCallPresenceStore } from '@/stores/callPresenceStore';
import {
  PeerSignal,
  PeerTransport,
  PeerTransportFactory,
} from '@/services/ports/PeerTransportPort';
import { createNativePeerTransport } from '@/services/adapters/NativePeerTransportAdapter';
import { deriveLocalMedia, MediaState } from '@/types/videoCall';
import { logger } from '@/utils/logger';

let peerTransportFactory: PeerTransportFactory = createNativePeerTransport;

/**
 * Swap the transport a dialled peer is built from, returning the restore function
 * — same shape as `setRandomSource`, so a caller cannot forget the teardown. Tests
 * pass a literal fake and drive the port's callbacks; nothing in the app calls it.
 */
export function setPeerTransportFactory(factory: PeerTransportFactory): () => void {
  const previous = peerTransportFactory;
  peerTransportFactory = factory;
  return () => {
    peerTransportFactory = previous;
  };
}

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
  peer: PeerTransport;
  /** Remote media, empty until the far side's tracks arrive. */
  stream: MediaStream;
  /** The connection's own view of itself. `connected` implies DTLS finished. */
  connectionState: RTCPeerConnectionState;
  /** `disconnected` past LINK_GRACE_MS, i.e. worth telling the user about. */
  reconnecting: boolean;
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
  /**
   * What each roster member says they are publishing, keyed by user id. Missing
   * entries and missing fields both mean unknown — see `MediaState`.
   */
  mediaStates: Map<string, MediaState>;
  isMuted: boolean;
  isVideoOff: boolean;
  /** Whether a camera was ever acquired. Distinguishes "turned off" from "has none". */
  hasCamera: boolean;
  /** Page visibility, which suppresses frames without releasing the device. */
  isPageHidden: boolean;
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
  /**
   * Async on the way back on: turning the camera off releases the device, so the
   * light goes out, and resuming means acquiring a fresh track.
   */
  toggleVideo: () => Promise<void>;
  handleVisibilityChange: (isHidden: boolean) => void;
  /** Forget a participant's spent retry budget and dial them again. */
  retryPeer: (targetUserId: string) => void;
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

export const useVideoCallStore = create<VideoCallState>((set, get) => {
  /** Pending "has this `disconnected` lasted long enough to mention?" checks. */
  const reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
  let visibilityListener: (() => void) | null = null;
  /** Detaches the roster listener. Held so cleanup never has to guess at the node. */
  let rosterDetach: (() => void) | null = null;
  /** Guards the camera re-acquire against a double tap. See `toggleVideo`. */
  let acquiringCamera = false;

  function clearReconnectTimer(targetUserId: string): void {
    const timer = reconnectTimers.get(targetUserId);
    if (!timer) return;
    clearTimeout(timer);
    reconnectTimers.delete(targetUserId);
  }

  /**
   * Whether the call has no room left. `capacityCount`, not the badge's `count`:
   * a participant whose heartbeat is throttled still holds a mesh slot, and
   * admitting past that gives everyone a graph too sparse to complete.
   *
   * Fails open before the first snapshot — waiting for it would put an RTDB round
   * trip between the tap and the camera on every join.
   */
  function callIsFull(): boolean {
    const { capacityCount, loaded } = useCallPresenceStore.getState();
    return loaded && capacityCount >= MAX_CALL_PARTICIPANTS;
  }

  function patchPeer(targetUserId: string, patch: Partial<PeerConnection>): void {
    const { peers } = get();
    const existing = peers.get(targetUserId);
    if (!existing) return;
    set({ peers: new Map(peers).set(targetUserId, { ...existing, ...patch }) });
  }

  /**
   * A track acquired while the page is hidden has to start suppressed, or we publish
   * `cam: 'hidden'` while sending real frames — peers would be told "Away" and shown
   * video. The acquire is asynchronous, so visibility can flip mid-flight.
   */
  function suppressIfHidden(stream: MediaStream): void {
    // The store's flag is what `deriveLocalMedia` publishes, so it is the authority.
    // `document.hidden` covers `initialize`, which acquires before the flag is set.
    if (!get().isPageHidden && !pageIsHidden()) return;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = false;
    });
  }

  /** Call after any `set` that changes what we publish. Never before. */
  function publishLocalMedia(): void {
    firebaseSignaling.publishMediaState(deriveLocalMedia(get()));
  }

  /**
   * Tear a peer down and remove it from the map. `retry: true` schedules another
   * attempt with backoff; `retry: false` is for participants who genuinely left.
   */
  function dropPeer(targetUserId: string, { retry }: { retry: boolean }): void {
    const { peers, peerRetries } = get();
    const peerData = peers.get(targetUserId);
    if (!peerData) return;

    clearReconnectTimer(targetUserId);

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

    // Remove from state before closing: closing re-enters through the transport's
    // own close callback, which would otherwise book a second retry for one failure.
    set({ peers: nextPeers, peerRetries: nextRetries });

    stopTracks(peerData.stream);
    if (!peerData.peer.closed) {
      peerData.peer.close();
    }
  }

  function clearRetries(targetUserId: string): void {
    const { peerRetries } = get();
    if (!peerRetries.has(targetUserId)) return;

    const nextRetries = new Map(peerRetries);
    nextRetries.delete(targetUserId);
    set({ peerRetries: nextRetries });
  }

  /** Log which candidate types carried the connection, once. See `candidatePair`. */
  async function logSelectedCandidatePair(peer: PeerTransport, targetUserId: string) {
    const types = await peer.candidateTypes();
    if (!types) return;

    logger.info('[videocall] Connected', targetUserId, types);
  }

  function openPeer(
    targetUserId: string,
    polite: boolean,
    localStream: MediaStream,
    iceServers: IceServer[]
  ): PeerConnection {
    let reported = false;

    const onConnected = () => {
      clearTimeout(connectionTimeout);
      clearRetries(targetUserId);

      // Reachable more than once — a connection that drops and recovers comes
      // back through here — but the candidate pair is only news the first time.
      if (reported) return;
      reported = true;
      logSelectedCandidatePair(peer, targetUserId);
    };

    const onLost = (reason: string, detail?: unknown) => {
      logger.warn('[videocall] Peer lost', targetUserId, reason, detail);
      clearTimeout(connectionTimeout);
      dropPeer(targetUserId, { retry: true });
    };

    const peer = peerTransportFactory({
      polite,
      label: targetUserId,
      localStream,
      iceServers,
      events: {
        onSignal: async (signal) => {
          try {
            if (signal.type === 'offer') {
              await firebaseSignaling.sendOffer(targetUserId, signal);
            } else if (signal.type === 'answer') {
              await firebaseSignaling.sendAnswer(targetUserId, signal);
            } else {
              await firebaseSignaling.sendIceCandidate(targetUserId, signal.candidate);
            }
          } catch (error) {
            logger.warn('[videocall] Failed to publish signal', targetUserId, error);
          }
        },

        onStream: (remoteStream) => {
          const { peers } = get();
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
          set({ peers: nextPeers });
        },

        onConnected,
        onClosed: () => onLost('closed'),
        onError: (error) => onLost('error', error),

        onIceStateChange: (iceConnectionState) => {
          logger.debug('[videocall] ICE state', targetUserId, iceConnectionState);

          // Deliberately not treated as connected: ICE reaches `connected` before
          // the DTLS handshake finishes, and clearing the retry budget there means
          // a peer whose handshake then fails re-books attempt 1 every time and
          // never exhausts MAX_RETRY_ATTEMPTS. The transport reports `connected`
          // off `connectionState`, which implies DTLS.
          if (iceConnectionState === 'failed') {
            onLost('ICE failed');
          }
        },

        onConnectionStateChange: (connectionState) => {
          clearReconnectTimer(targetUserId);
          patchPeer(targetUserId, { connectionState, reconnecting: false });

          // Not news yet — see LINK_GRACE_MS.
          if (connectionState !== 'disconnected') return;

          reconnectTimers.set(
            targetUserId,
            setTimeout(() => {
              reconnectTimers.delete(targetUserId);
              if (get().peers.get(targetUserId)?.connectionState !== 'disconnected') return;
              patchPeer(targetUserId, { reconnecting: true });
            }, LINK_GRACE_MS)
          );
        },
      },
    });

    const connectionTimeout = setTimeout(() => {
      if (!peer.closed) onLost('never connected');
    }, CONNECT_TIMEOUT_MS);

    return {
      peer,
      stream: new MediaStream(),
      connectionState: 'new',
      reconnecting: false,
    };
  }

  /**
   * Route a signal from the room to the connection it belongs to.
   *
   * There is nothing left to decide here: under perfect negotiation the transport
   * itself knows whether a description is applicable, so the store's only jobs are
   * routing and admission control.
   */
  function handleSignal(data: SignalData): void {
    const { peers, userId: currentUserId, localStream, iceServers } = get();
    if (!currentUserId || !localStream || data.from === currentUserId) return;

    const signal = toPeerSignal(data);
    if (!signal) return;

    let peerConnection = peers.get(data.from);

    if (!peerConnection) {
      // Only an offer opens a connection. An answer or a candidate naming someone
      // we are not dialling is either late or forged.
      if (signal.type !== 'offer') return;

      // Signalling rules let any authenticated user push an offer into anyone's
      // queue, and `from` is client-supplied, so cap peer construction. The
      // roster check waits for the first snapshot rather than for a non-empty
      // one: RTDB delivers asynchronously and rejecting during that window
      // discards a legitimate offer the sender will not resend until its 30s
      // timeout, but "empty" is a real state a throttled tab can reach, and
      // keying on it would quietly reopen the gate.
      const { roster, rosterLoaded } = get();
      if (peers.size >= MAX_PEERS || (rosterLoaded && !roster.includes(data.from))) {
        logger.warn('[videocall] Ignoring unexpected offer', data.from);
        return;
      }

      peerConnection = openPeer(
        data.from,
        isPolite(currentUserId, data.from),
        localStream,
        iceServers
      );
      set({ peers: new Map(peers).set(data.from, peerConnection) });
    }

    if (peerConnection.peer.closed) return;
    peerConnection.peer.accept(signal);
  }

  return {
    localStream: null,
    peers: new Map(),
    iceServers: ICE_SERVERS,
    roster: [],
    rosterLoaded: false,
    peerRetries: new Map(),
    mediaStates: new Map(),
    isMuted: false,
    isVideoOff: false,
    hasCamera: false,
    isPageHidden: false,
    isInitialized: false,
    isCallActive: false,
    heartbeatInterval: null,
    reconcileInterval: null,
    roomId: null,
    userId: null,
    error: null,

    initialize: async (roomId: string, userId: string) => {
      // Both call sites (VideoSidebar, VideoControls) reach this, and it awaits
      // twice before `isInitialized` flips, so the flag alone gates nothing. The generation token also catches a `cleanup()`
      // that lands mid-await, which would otherwise leave a listener and two
      // intervals running that nothing holds a handle to.
      if (get().isInitialized || activeGeneration !== null) {
        return;
      }

      // Before the camera, not at `claim()`: by then the stream already exists, so
      // a check there would still have prompted for the camera and lit the device
      // up for someone who can never be dialled.
      // No error state — `CallCapacityAlert` already says the call is full, and the
      // store's error surface would render a second, dismissible alert beside it.
      // The join control is disabled instead, so this tap should not be reachable.
      if (callIsFull()) {
        logger.warn('[videocall] Call is full, not joining');
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
      // Published from the first write, so a peer granted a mic but no camera is
      // described correctly before any media has had a chance to flow.
      const hasCamera = stream.getVideoTracks().length > 0;

      try {
        await firebaseSignaling.claim(roomId, userId, initialMediaState(hasCamera));
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
        mediaStates: new Map(),
        hasCamera,
        isPageHidden: pageIsHidden(),
        isMuted: false,
        isVideoOff: false,
        roomId,
        userId,
      });

      // Owned here rather than in a component: both the mobile tab and the desktop
      // sidebar host the call, and a backgrounded tab that goes on emitting black
      // frames is indistinguishable from a camera that was switched off.
      visibilityListener = () => get().handleVisibilityChange(document.hidden);
      document.addEventListener('visibilitychange', visibilityListener);

      // Reconcile against the page state *now*, not the one we acquired in: the claim
      // above is a round trip, and nothing was listening for a flip during it.
      suppressIfHidden(stream);
      publishLocalMedia();

      const database = getDatabase();
      const usersRef = ref(database, `video-calls/${roomId}/users`);

      rosterDetach = onValue(usersRef, (snapshot) => {
        const { rosterLoaded: alreadyLoaded, roster: previousRoster } = get();
        const users = snapshot.val();

        // Media flags share this node, so every peer's mute, camera toggle and tab
        // switch now re-fires the snapshot — where it used to fire only on join,
        // leave and the 30s heartbeat. Handing back the previous array when
        // membership is unchanged keeps that churn from re-rendering every tile.
        const nextRoster = liveRoster(users);
        const membershipChanged = !sameOrder(previousRoster, nextRoster);

        set({
          roster: membershipChanged ? nextRoster : previousRoster,
          rosterLoaded: true,
          mediaStates: rosterMediaStates(users),
        });
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
        } else if (peerData.peer.closed) {
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
        const connection = openPeer(
          otherUserId,
          isPolite(userId, otherUserId),
          localStream,
          iceServers
        );
        set({ peers: new Map(get().peers).set(otherUserId, connection) });
      }
    },

    cleanup: () => {
      // Invalidates any `initialize` still awaiting, so it abandons its stream
      // rather than installing listeners and intervals after the teardown.
      activeGeneration = null;

      if (visibilityListener) {
        document.removeEventListener('visibilitychange', visibilityListener);
        visibilityListener = null;
      }

      reconnectTimers.forEach((timer) => clearTimeout(timer));
      reconnectTimers.clear();

      const { localStream, peers, heartbeatInterval, reconcileInterval } = get();

      if (localStream) {
        stopTracks(localStream);
      }

      peers.forEach((peerData) => {
        if (!peerData.peer.closed) {
          peerData.peer.close();
        }
        stopTracks(peerData.stream);
      });

      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }

      if (reconcileInterval) {
        clearInterval(reconcileInterval);
      }

      // The captured unsubscribe, never `off(ref)`. A bare `off` with no event type
      // or callback is a blanket detach of *every* listener at that location, and
      // the participant badge keeps its own read-only listener on this same node —
      // so leaving a call used to silently kill the badge for the rest of the
      // session, and with it the count the join gate reads.
      rosterDetach?.();
      rosterDetach = null;

      firebaseSignaling.cleanup();

      set({
        localStream: null,
        peers: new Map(),
        roster: [],
        rosterLoaded: false,
        peerRetries: new Map(),
        mediaStates: new Map(),
        hasCamera: false,
        isPageHidden: false,
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
      if (!audioTrack) return;

      // Disabled, never stopped: releasing a microphone makes Bluetooth headsets
      // renegotiate their profile — audible, and it clips the first word back.
      const newMutedState = !isMuted;
      audioTrack.enabled = !newMutedState;
      set({ isMuted: newMutedState });
      publishLocalMedia();
    },

    toggleVideo: async () => {
      const { localStream, isVideoOff, peers } = get();
      if (!localStream) return;

      // Re-acquiring the camera is several hundred milliseconds during which
      // `isVideoOff` is still true and the button is still live. A second tap would
      // start a second acquisition and orphan the first track — never stopped, so
      // the camera light stays on for the rest of the session.
      if (acquiringCamera) return;

      if (!isVideoOff) {
        // Detach from the senders first: a sender still holding a stopped track is
        // required to keep emitting black frames, so releasing the camera on its own
        // leaves every peer paying for a rectangle of nothing.
        peers.forEach((peerData) => {
          if (!peerData.peer.closed) peerData.peer.setVideoTrack(null);
        });
        localStream.getVideoTracks().forEach((track) => track.stop());

        // A new stream object, not a mutated one: components key re-attachment off
        // the stream's identity and would otherwise keep rendering the dead track.
        set({
          localStream: new MediaStream(localStream.getAudioTracks()),
          isVideoOff: true,
        });
        publishLocalMedia();
        return;
      }

      let camera: MediaStream;
      acquiringCamera = true;
      try {
        // Video only — re-acquiring audio would take the microphone down with it.
        camera = await navigator.mediaDevices.getUserMedia({ video: MEDIA_CONSTRAINTS.video });
      } catch (error) {
        const mediaError = createMediaError(error);
        logger.warn('[videocall] Could not re-acquire the camera', mediaError.type, error);
        set({ error: mediaError });
        return;
      } finally {
        acquiringCamera = false;
      }

      const videoTrack = camera.getVideoTracks()[0];
      if (!videoTrack) return;
      suppressIfHidden(camera);

      const current = get().localStream;
      if (!current) {
        // The call ended while the camera was being acquired.
        videoTrack.stop();
        return;
      }

      get().peers.forEach((peerData) => {
        if (!peerData.peer.closed) peerData.peer.setVideoTrack(videoTrack);
      });

      set({
        localStream: new MediaStream([...current.getAudioTracks(), videoTrack]),
        isVideoOff: false,
        hasCamera: true,
      });
      publishLocalMedia();
    },

    handleVisibilityChange: (isHidden: boolean) => {
      set({ isPageHidden: isHidden });

      const { localStream, isVideoOff } = get();
      if (!localStream) return;

      // Suppress frames but hold the device: backgrounding is transient, and
      // releasing the camera would cost a re-acquire on every tab switch.
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        if (isHidden) {
          videoTrack.enabled = false;
        } else if (!isVideoOff) {
          videoTrack.enabled = true;
        }
      }

      publishLocalMedia();
    },

    retryPeer: (targetUserId: string) => {
      const nextRetries = new Map(get().peerRetries);
      nextRetries.delete(targetUserId);
      set({ peerRetries: nextRetries });
      get().reconcilePeers();
    },

    disconnectCall: () => {
      const { localStream, heartbeatInterval } = get();
      if (!localStream) return;

      stopTracks(localStream);

      // Hanging up gives the roster slot back. Signalling stays up so the call can
      // be resumed, but a hung-up participant that kept its slot would occupy one
      // of everyone else's MAX_PEERS connections while sending nothing.
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      firebaseSignaling.setPresent(false).catch((error) => {
        logger.warn('[videocall] Could not release the roster slot', error);
      });

      set({
        localStream: null,
        heartbeatInterval: null,
        isCallActive: false,
        isMuted: false,
        isVideoOff: false,
        hasCamera: false,
        isPageHidden: false,
      });
    },

    reconnectCall: async () => {
      const { isInitialized } = get();
      if (!isInitialized) return;

      // Hanging up gave the slot back, so resuming is a fresh claim and has to
      // clear the same bar as joining. Without this, anyone who hung up in a busy
      // call could reclaim past the cap — and would have opened their camera to
      // find out.
      if (callIsFull()) {
        logger.warn('[videocall] Call is full, not reconnecting');
        return;
      }

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

      suppressIfHidden(stream);

      // Peers survived the hang-up holding senders for tracks we stopped. Swapping
      // the fresh tracks in is what makes the far side see video again; without it
      // they keep receiving dead media and we render only our own preview.
      get().peers.forEach((peerData, peerId) => {
        if (peerData.peer.closed) return;

        try {
          peerData.peer.replaceLocalTracks(stream);
        } catch (error) {
          logger.warn('[videocall] Failed to attach fresh tracks to peer', peerId, error);
        }
      });

      const hasCamera = stream.getVideoTracks().length > 0;

      firebaseSignaling.setPresent(true, initialMediaState(hasCamera)).catch((error) => {
        logger.warn('[videocall] Could not reclaim the roster slot', error);
      });

      const { heartbeatInterval: existingHeartbeat } = get();
      if (existingHeartbeat) {
        clearInterval(existingHeartbeat);
      }

      set({
        localStream: stream,
        heartbeatInterval: startHeartbeat(),
        isCallActive: true,
        isMuted: false,
        isVideoOff: false,
        hasCamera,
        isPageHidden: pageIsHidden(),
      });
    },

    clearError: () => {
      set({ error: null });
    },
  };
});

function sameOrder(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/** A fresh slot publishes the post-reset flags, which claim runs ahead of. */
function initialMediaState(hasCamera: boolean): MediaState {
  return deriveLocalMedia({
    hasCamera,
    isVideoOff: false,
    isMuted: false,
    isPageHidden: pageIsHidden(),
  });
}

/** Safe in the store's own tests, which have no document. */
function pageIsHidden(): boolean {
  return typeof document !== 'undefined' && document.hidden;
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
 * Which side of a pair yields when both offer at once.
 *
 * Perfect negotiation needs exactly one polite peer per connection: on a collision
 * the polite side accepts the incoming offer — rolling its own back — while the
 * impolite side ignores it and expects its own offer to be answered. Comparing the
 * two user ids decides that without a round trip, and both ends reach the same
 * answer because the comparison is the same on both. The higher id is polite,
 * which leaves negotiation opened by the same side as it always was.
 */
export function isPolite(localUserId: string, remoteUserId: string): boolean {
  return localUserId > remoteUserId;
}

/** Narrow a room signal to something a transport can take, or reject it. */
function toPeerSignal(data: SignalData): PeerSignal | null {
  if (data.type === 'offer' && data.sdp) return { type: 'offer', sdp: data.sdp };
  if (data.type === 'answer' && data.sdp) return { type: 'answer', sdp: data.sdp };
  if (data.type === 'ice-candidate' && data.candidate) {
    return { type: 'candidate', candidate: data.candidate };
  }
  return null;
}
