import { CandidateTypes, selectCandidateTypes } from '@/services/candidatePair';
import type {
  PeerSignal,
  PeerTransport,
  PeerTransportOptions,
} from '@/services/ports/PeerTransportPort';
import { LINK_GRACE_MS } from '@/config/webrtc';
import { logger } from '@/utils/logger';

interface OfferDecision {
  polite: boolean;
  makingOffer: boolean;
  signalingState: RTCSignalingState;
  settingRemoteAnswer: boolean;
  type: 'offer' | 'answer';
}

/**
 * The whole of glare avoidance, as a decision. Canonical explanation lives here;
 * elsewhere just points at it.
 *
 * Both sides offer freely, so simultaneous offers are the normal case — and
 * applying a remote offer while holding a local one is illegal, while both sides
 * backing off connects nobody. W3C perfect negotiation settles it by role: the
 * impolite peer ignores the collision and expects its own offer answered, the
 * polite peer accepts it, which implicitly rolls its own back. Readiness is
 * `signalingState`, the connection's own answer to "can I take an offer now?",
 * not a lock or a timer. An answer mid-apply counts as ready — momentarily
 * `have-local-offer`, about to settle.
 */
export function shouldIgnoreOffer({
  polite,
  makingOffer,
  signalingState,
  settingRemoteAnswer,
  type,
}: OfferDecision): boolean {
  const readyForOffer = !makingOffer && (signalingState === 'stable' || settingRemoteAnswer);
  return type === 'offer' && !readyForOffer && !polite;
}

/** A mesh leg on native `RTCPeerConnection`. Glare: see `shouldIgnoreOffer`. */
export function createNativePeerTransport({
  polite,
  label,
  localStream,
  iceServers,
  events,
}: PeerTransportOptions): PeerTransport {
  const pc = new RTCPeerConnection({
    iceServers,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceCandidatePoolSize: 0,
  });

  const tag = `[peer ${label}]`;

  let closed = false;
  let makingOffer = false;
  let settingRemoteAnswer = false;
  let iceRestartTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * Candidates that arrived before the description they belong to.
   * `addIceCandidate` rejects until a remote description exists, and the
   * signalling channel delivers candidates and SDP on independent paths.
   */
  let pendingCandidates: RTCIceCandidateInit[] = [];
  /** Remote tracks only need a stream of our own if the far side sent none. */
  let orphanStream: MediaStream | null = null;

  const senders = new Map<string, RTCRtpSender>();
  localStream.getTracks().forEach((track) => {
    senders.set(track.kind, pc.addTrack(track, localStream));
  });

  function publishLocalDescription(): void {
    const description = pc.localDescription;
    if (!description?.sdp) return;
    if (description.type !== 'offer' && description.type !== 'answer') return;

    events.onSignal({ type: description.type, sdp: description.sdp });
  }

  pc.addEventListener('negotiationneeded', async () => {
    if (closed) return;

    try {
      makingOffer = true;
      // No argument: the connection picks the description its own state calls
      // for, which is what makes an ICE restart and a renegotiation the same code.
      await pc.setLocalDescription();
      publishLocalDescription();
    } catch (error) {
      logger.warn(`${tag} Could not open negotiation`, error);
    } finally {
      makingOffer = false;
    }
  });

  pc.addEventListener('icecandidate', ({ candidate }) => {
    // A null candidate is end-of-gathering, which the far side infers anyway.
    if (candidate) events.onSignal({ type: 'candidate', candidate: candidate.toJSON() });
  });

  pc.addEventListener('track', (event) => {
    const [stream] = event.streams;
    if (stream) {
      events.onStream(stream);
      return;
    }

    orphanStream ??= new MediaStream();
    orphanStream.addTrack(event.track);
    events.onStream(orphanStream);
  });

  pc.addEventListener('iceconnectionstatechange', () => {
    if (closed) return;

    const state = pc.iceConnectionState;
    events.onIceStateChange(state);

    // A network that changed underneath the connection needs fresh candidates to
    // recover, but most `disconnected` transitions heal on their own — so wait one
    // grace period and re-check rather than restarting on every blip. Restarting
    // eagerly costs a full re-gather and a fresh TURN allocation each time, is
    // unbounded on a flapping link, and when both ends do it at once the glare
    // discards one side's whole gather.
    if (state === 'disconnected') {
      if (iceRestartTimer) return;
      iceRestartTimer = setTimeout(() => {
        iceRestartTimer = null;
        if (closed || pc.iceConnectionState !== 'disconnected') return;

        try {
          pc.restartIce();
        } catch (error) {
          logger.warn(`${tag} Could not restart ICE`, error);
        }
      }, LINK_GRACE_MS);
    }
  });

  // Connection state, not ICE state: it implies a finished DTLS handshake, so it
  // is the only signal that means media can actually flow.
  pc.addEventListener('connectionstatechange', () => {
    if (closed) return;

    events.onConnectionStateChange(pc.connectionState);

    if (pc.connectionState === 'connected') {
      events.onConnected();
    } else if (pc.connectionState === 'failed') {
      // Not the same as ICE failing: a DTLS handshake can fail with ICE happily
      // connected, which looks exactly like "I only see myself".
      events.onError(new Error(`${tag} connection failed`));
    }
  });

  async function addRemoteCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      await pc.addIceCandidate(candidate);
    } catch (error) {
      // Routine: candidates belonging to an offer we ignored are expected to be
      // unusable, and there is no reliable way to tell those apart afterwards.
      logger.debug(`${tag} Could not add a remote candidate`, error);
    }
  }

  async function apply(signal: PeerSignal): Promise<void> {
    if (closed) return;

    if (signal.type === 'candidate') {
      if (!pc.remoteDescription) {
        pendingCandidates.push(signal.candidate);
        return;
      }
      await addRemoteCandidate(signal.candidate);
      return;
    }

    const ignoreOffer = shouldIgnoreOffer({
      polite,
      makingOffer,
      signalingState: pc.signalingState,
      settingRemoteAnswer,
      type: signal.type,
    });
    if (ignoreOffer) {
      logger.debug(`${tag} Ignoring a colliding offer; ours is still in flight`);
      return;
    }

    settingRemoteAnswer = signal.type === 'answer';
    try {
      // A collision rolls the polite peer's pending offer back implicitly; no
      // explicit rollback description is needed.
      await pc.setRemoteDescription({ type: signal.type, sdp: signal.sdp });
    } finally {
      settingRemoteAnswer = false;
    }

    const queued = pendingCandidates;
    pendingCandidates = [];
    for (const candidate of queued) {
      await addRemoteCandidate(candidate);
    }

    if (signal.type === 'offer') {
      await pc.setLocalDescription();
      publishLocalDescription();
    }
  }

  // Signals arrive from an unordered channel and each application is several
  // awaits long, so they are applied one at a time. Interleaving them would let
  // an answer land in the middle of an offer being answered.
  let applying: Promise<void> = Promise.resolve();

  return {
    get closed() {
      return closed;
    },

    accept(signal: PeerSignal) {
      applying = applying
        .then(() => apply(signal))
        .catch((error) => {
          logger.warn(`${tag} Could not apply a remote ${signal.type}`, error);
        });
    },

    replaceLocalTracks(stream: MediaStream) {
      stream.getTracks().forEach((track) => {
        const sender = senders.get(track.kind);
        try {
          if (sender) {
            // Same kind, so this needs no renegotiation.
            sender.replaceTrack(track).catch((error: unknown) => {
              logger.warn(`${tag} Could not replace the ${track.kind} track`, error);
            });
          } else {
            senders.set(track.kind, pc.addTrack(track, stream));
          }
        } catch (error) {
          logger.warn(`${tag} Could not attach a fresh ${track.kind} track`, error);
        }
      });
    },

    setVideoTrack(track: MediaStreamTrack | null) {
      const sender = senders.get('video');
      if (sender) {
        // Swapping onto an existing sender needs no renegotiation.
        sender.replaceTrack(track).catch((error: unknown) => {
          logger.warn(`${tag} Could not ${track ? 'attach' : 'detach'} the video track`, error);
        });
        return;
      }

      if (!track) return;

      // No video sender at all, because this peer was dialled while the camera was
      // off and the local stream carried audio only. Adding one renegotiates, which
      // is the only way the far side ever receives video on this connection.
      try {
        senders.set('video', pc.addTrack(track, localStream));
      } catch (error) {
        logger.warn(`${tag} Could not add a video track`, error);
      }
    },

    async candidateTypes(): Promise<CandidateTypes | null> {
      if (closed) return null;

      try {
        return selectCandidateTypes(await pc.getStats());
      } catch (error) {
        logger.debug(`${tag} Could not read connection stats`, error);
        return null;
      }
    },

    close() {
      if (closed) return;
      closed = true;
      if (iceRestartTimer) clearTimeout(iceRestartTimer);
      pc.close();
      events.onClosed();
    },
  };
}
