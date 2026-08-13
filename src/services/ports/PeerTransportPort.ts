import { IceServer } from '@/config/webrtc';
import { CandidateTypes } from '@/services/candidatePair';

/**
 * One leg of the mesh, as the call store needs it.
 *
 * The store owns *policy* — who to dial, how many at once, when to give up, how
 * long to wait for a connection. This port owns *transport*: SDP, ICE, tracks.
 * Nothing about retries, rosters or peer limits belongs here.
 */

/** A message that has to reach the other side, or has arrived from it. */
export type PeerSignal =
  | { type: 'offer'; sdp: string }
  | { type: 'answer'; sdp: string }
  | { type: 'candidate'; candidate: RTCIceCandidateInit };

export interface PeerTransportEvents {
  /** Publish this to the far side through the signalling channel. */
  onSignal: (signal: PeerSignal) => void;
  /** Remote media arrived or was renegotiated. */
  onStream: (stream: MediaStream) => void;
  onConnected: () => void;
  /**
   * The connection is gone. Fired exactly once, synchronously, from `close()`
   * as well as from a spontaneous teardown — the store's `dropPeer` re-enters
   * through this and relies on it happening before `close()` returns.
   */
  onClosed: () => void;
  onError: (error: Error) => void;
  onIceStateChange: (state: RTCIceConnectionState) => void;
  /**
   * The connection's own aggregate state, which unlike ICE state implies a finished
   * DTLS handshake. Reported so the UI can tell "still connecting" from "connected
   * but the far side is publishing nothing" — otherwise both are a black rectangle.
   */
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
}

export interface PeerTransportOptions {
  /**
   * Which side yields when both offer at once. Exactly one peer of a pair must be
   * polite; see `isPolite` in the call store for how the pair agrees without
   * exchanging a message.
   */
  polite: boolean;
  /** Identifies this leg in logs. Never on the wire. */
  label: string;
  localStream: MediaStream;
  iceServers: IceServer[];
  events: PeerTransportEvents;
}

export interface PeerTransport {
  readonly closed: boolean;
  /**
   * Hand over a signal from the far side. Applied asynchronously and in order;
   * a signal the connection rejects is the transport's to log, not the caller's.
   */
  accept: (signal: PeerSignal) => void;
  /** Point this connection's senders at a fresh local stream. */
  replaceLocalTracks: (stream: MediaStream) => void;
  /**
   * Attach or detach the outgoing video track. `null` is what actually stops video
   * reaching the far side — a sender holding a stopped track still emits black
   * frames, so releasing the camera alone changes nothing the peer can see.
   */
  setVideoTrack: (track: MediaStreamTrack | null) => void;
  /** Candidate types that carried the connection, for diagnostics. */
  candidateTypes: () => Promise<CandidateTypes | null>;
  /** Idempotent. Fires `onClosed` synchronously on the first call only. */
  close: () => void;
}

export type PeerTransportFactory = (options: PeerTransportOptions) => PeerTransport;
