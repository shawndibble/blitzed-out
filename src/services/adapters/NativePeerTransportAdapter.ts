import { CandidateTypes, selectCandidateTypes } from '@/services/candidatePair';
import type {
  PeerSignal,
  PeerTransport,
  PeerTransportOptions,
} from '@/services/ports/PeerTransportPort';
import { logger } from '@/utils/logger';

interface OfferDecision {
  /** True when this side is mid-offer or otherwise not ready to take one. */
  polite: boolean;
  makingOffer: boolean;
  signalingState: RTCSignalingState;
  settingRemoteAnswer: boolean;
  type: 'offer' | 'answer';
}

/**
 * The whole of glare avoidance, as a decision.
 *
 * Two peers that offer at the same moment cannot both proceed: applying a remote
 * offer while holding a local one is illegal, and if both sides back off nobody
 * connects. W3C perfect negotiation resolves it by role — the impolite peer
 * ignores the colliding offer and expects its own to be answered; the polite peer
 * accepts the collision, which implicitly rolls its own offer back.
 *
 * `signalingState === 'stable'` is the readiness test rather than a lock or a
 * timer, because it is the connection's own answer to "can I take an offer right
 * now?". An answer already being applied counts as ready: the state is momentarily
 * `have-local-offer` but is about to settle.
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

/**
 * A mesh leg on native `RTCPeerConnection`, negotiated by the W3C perfect
 * negotiation pattern.
 *
 * Both sides add their tracks and offer freely; collisions are settled by the
 * polite/impolite roles rather than by a lock, so there is no window in which one
 * side has given up and the other is still waiting.
 */
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
  let ignoreOffer = false;
  let settingRemoteAnswer = false;
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

    // `disconnected` is often transient, but a network that changed underneath
    // the connection needs fresh candidates to recover. Nothing used to try:
    // the connection sat there until it aged into `failed` and was torn down.
    if (state === 'disconnected') {
      try {
        pc.restartIce();
      } catch (error) {
        logger.warn(`${tag} Could not restart ICE`, error);
      }
    }
  });

  // Connection state, not ICE state, is what says media can flow — and it is the
  // single source for "connected" so the store is never told twice.
  pc.addEventListener('connectionstatechange', () => {
    if (closed) return;

    if (pc.connectionState === 'connected') {
      events.onConnected();
    } else if (pc.connectionState === 'failed') {
      // Not the same as ICE failing: a DTLS handshake can fail with ICE happily
      // connected, which looks exactly like "I only see myself" and used to be
      // reported by nothing at all.
      events.onError(new Error(`${tag} connection failed`));
    }
  });

  async function addRemoteCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      await pc.addIceCandidate(candidate);
    } catch (error) {
      // Candidates belonging to an offer we deliberately ignored are expected to
      // be unusable; anything else is worth knowing about.
      if (!ignoreOffer) logger.warn(`${tag} Could not add a remote candidate`, error);
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

    ignoreOffer = shouldIgnoreOffer({
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
      // On a collision the polite peer's own pending offer is rolled back here,
      // implicitly — no explicit rollback description is needed.
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
      pc.close();
      events.onClosed();
    },
  };
}
