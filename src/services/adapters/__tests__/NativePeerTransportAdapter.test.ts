/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createNativePeerTransport,
  shouldIgnoreOffer,
} from '@/services/adapters/NativePeerTransportAdapter';
import type { PeerTransport, PeerTransportEvents } from '@/services/ports/PeerTransportPort';

/**
 * A connection with the parts of the RTCPeerConnection state machine the
 * negotiation depends on: which descriptions are legal in which signalling state,
 * what a no-argument `setLocalDescription` produces, and the fact that
 * `addIceCandidate` needs a remote description first.
 */
class FakePeerConnection {
  static instances: FakePeerConnection[] = [];

  signalingState = 'stable';
  iceConnectionState = 'new';
  connectionState = 'new';
  localDescription: { type: string; sdp: string } | null = null;
  remoteDescription: { type: string; sdp: string } | null = null;
  config: any;
  senders: any[] = [];
  addedCandidates: RTCIceCandidateInit[] = [];
  /** Set when a local offer was dropped to take a remote one. */
  rolledBack = false;
  closed = false;
  restartIce = vi.fn();
  getStats = vi.fn(async () => new Map());

  private listeners = new Map<string, Array<(event: any) => void>>();
  private descriptions = 0;

  constructor(config: any) {
    this.config = config;
    FakePeerConnection.instances.push(this);
  }

  addTrack(track: MediaStreamTrack, _stream: MediaStream) {
    const sender = { track, replaceTrack: vi.fn(async (next: MediaStreamTrack) => next) };
    this.senders.push(sender);
    return sender as unknown as RTCRtpSender;
  }

  addEventListener(type: string, handler: (event: any) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), handler]);
  }

  dispatch(type: string, event: any = {}) {
    this.listeners.get(type)?.forEach((handler) => handler(event));
  }

  async setLocalDescription(description?: { type: string; sdp: string }) {
    // No argument means "whatever this state calls for", which is an answer when
    // a remote offer is pending and an offer otherwise.
    const type =
      description?.type ?? (this.signalingState === 'have-remote-offer' ? 'answer' : 'offer');
    this.descriptions += 1;
    this.localDescription = { type, sdp: description?.sdp ?? `local-${type}-${this.descriptions}` };
    this.signalingState = type === 'offer' ? 'have-local-offer' : 'stable';
  }

  async setRemoteDescription(description: { type: string; sdp: string }) {
    if (description.type === 'offer') {
      if (this.signalingState === 'have-local-offer') this.rolledBack = true;
      this.remoteDescription = description;
      this.signalingState = 'have-remote-offer';
      return;
    }

    if (this.signalingState !== 'have-local-offer') {
      throw new DOMException('Called in wrong state', 'InvalidStateError');
    }
    this.remoteDescription = description;
    this.signalingState = 'stable';
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.remoteDescription) {
      throw new DOMException('No remote description', 'InvalidStateError');
    }
    this.addedCandidates.push(candidate);
  }

  close() {
    this.closed = true;
    this.signalingState = 'closed';
  }
}

/** Let the transport's internal promise chain settle. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function track(kind: 'audio' | 'video'): MediaStreamTrack {
  return { kind, stop: vi.fn(), enabled: true } as unknown as MediaStreamTrack;
}

function streamOf(tracks: MediaStreamTrack[]): MediaStream {
  return { getTracks: () => tracks } as unknown as MediaStream;
}

function signalsOfType(events: any, type: string) {
  return events.onSignal.mock.calls
    .map(([signal]: [any]) => signal)
    .filter((signal: any) => signal.type === type);
}

describe('native peer transport', () => {
  const ICE = [{ urls: 'turns:turn.example:5349', username: 'u', credential: 'c' }];
  let video: MediaStreamTrack;
  let audio: MediaStreamTrack;
  let localStream: MediaStream;

  beforeEach(() => {
    FakePeerConnection.instances.length = 0;
    vi.stubGlobal('RTCPeerConnection', FakePeerConnection);
    video = track('video');
    audio = track('audio');
    localStream = streamOf([video, audio]);
  });

  function open(polite = false): {
    transport: PeerTransport;
    pc: FakePeerConnection;
    events: PeerTransportEvents & Record<string, any>;
  } {
    const events = {
      onSignal: vi.fn(),
      onStream: vi.fn(),
      onConnected: vi.fn(),
      onClosed: vi.fn(),
      onError: vi.fn(),
      onIceStateChange: vi.fn(),
    };
    const transport = createNativePeerTransport({
      polite,
      label: 'zed',
      localStream,
      iceServers: ICE,
      events,
    });
    return { transport, pc: FakePeerConnection.instances.at(-1)!, events };
  }

  test('opens the connection with the ICE servers it was given and both local tracks', () => {
    const { pc } = open();

    expect(pc.config.iceServers).toEqual(ICE);
    expect(pc.senders.map((sender) => sender.track)).toEqual([video, audio]);
  });

  test('offers when the connection asks to negotiate', async () => {
    const { pc, events } = open();

    pc.dispatch('negotiationneeded');
    await flush();

    expect(signalsOfType(events, 'offer')).toHaveLength(1);
    expect(pc.signalingState).toBe('have-local-offer');
  });

  test('publishes local candidates as they are gathered', () => {
    const { pc, events } = open();

    pc.dispatch('icecandidate', {
      candidate: { toJSON: () => ({ candidate: 'candidate:1 1 udp' }) },
    });
    pc.dispatch('icecandidate', { candidate: null });

    expect(signalsOfType(events, 'candidate')).toEqual([
      { type: 'candidate', candidate: { candidate: 'candidate:1 1 udp' } },
    ]);
  });

  test('answers a remote offer', async () => {
    const { transport, pc, events } = open();

    transport.accept({ type: 'offer', sdp: 'remote-offer' });
    await flush();

    expect(pc.remoteDescription).toEqual({ type: 'offer', sdp: 'remote-offer' });
    expect(signalsOfType(events, 'answer')).toHaveLength(1);
    expect(pc.signalingState).toBe('stable');
  });

  test('settles negotiation when its own offer is answered', async () => {
    const { transport, pc } = open();
    pc.dispatch('negotiationneeded');
    await flush();

    transport.accept({ type: 'answer', sdp: 'remote-answer' });
    await flush();

    expect(pc.signalingState).toBe('stable');
    expect(pc.remoteDescription).toEqual({ type: 'answer', sdp: 'remote-answer' });
  });

  // Both sides add tracks and offer, so simultaneous offers are the normal case,
  // not an edge case. Exactly one side has to give way.
  describe('glare', () => {
    test('the impolite peer ignores a colliding offer and keeps its own', async () => {
      const { transport, pc, events } = open(false);
      pc.dispatch('negotiationneeded');
      await flush();

      transport.accept({ type: 'offer', sdp: 'their-offer' });
      await flush();

      expect(pc.remoteDescription).toBeNull();
      expect(pc.rolledBack).toBe(false);
      expect(signalsOfType(events, 'answer')).toHaveLength(0);
      expect(pc.signalingState).toBe('have-local-offer');
    });

    test('the polite peer rolls its own offer back and answers', async () => {
      const { transport, pc, events } = open(true);
      pc.dispatch('negotiationneeded');
      await flush();

      transport.accept({ type: 'offer', sdp: 'their-offer' });
      await flush();

      expect(pc.rolledBack).toBe(true);
      expect(pc.remoteDescription).toEqual({ type: 'offer', sdp: 'their-offer' });
      expect(signalsOfType(events, 'answer')).toHaveLength(1);
      expect(pc.signalingState).toBe('stable');
    });

    test('an offer with nothing in flight is answered whichever side is polite', async () => {
      for (const polite of [true, false]) {
        const { transport, pc, events } = open(polite);

        transport.accept({ type: 'offer', sdp: 'their-offer' });
        await flush();

        expect(signalsOfType(events, 'answer')).toHaveLength(1);
        expect(pc.signalingState).toBe('stable');
      }
    });
  });

  describe('trickled candidates', () => {
    // The signalling channel carries candidates and descriptions on independent
    // paths, so a candidate routinely arrives first — and `addIceCandidate`
    // rejects until there is a remote description to attach it to.
    test('holds a candidate that arrives before the description it belongs to', async () => {
      const { transport, pc } = open();

      transport.accept({ type: 'candidate', candidate: { candidate: 'early' } });
      await flush();
      expect(pc.addedCandidates).toEqual([]);

      transport.accept({ type: 'offer', sdp: 'their-offer' });
      await flush();

      expect(pc.addedCandidates).toEqual([{ candidate: 'early' }]);
    });

    test('applies candidates that arrive after the description straight away', async () => {
      const { transport, pc } = open();
      transport.accept({ type: 'offer', sdp: 'their-offer' });
      await flush();

      transport.accept({ type: 'candidate', candidate: { candidate: 'late' } });
      await flush();

      expect(pc.addedCandidates).toEqual([{ candidate: 'late' }]);
    });

    test('keeps the order candidates were gathered in', async () => {
      const { transport, pc } = open();

      transport.accept({ type: 'candidate', candidate: { candidate: 'first' } });
      transport.accept({ type: 'candidate', candidate: { candidate: 'second' } });
      transport.accept({ type: 'offer', sdp: 'their-offer' });
      await flush();

      expect(pc.addedCandidates).toEqual([{ candidate: 'first' }, { candidate: 'second' }]);
    });
  });

  // The signalling queue can replay, and the old code kept the last SDP of each
  // kind to guard against it. Perfect negotiation needs no such bookkeeping: a
  // repeated description either renegotiates harmlessly or is rejected.
  describe('replayed signals', () => {
    test('answers a repeated offer and stays settled', async () => {
      const { transport, pc, events } = open();

      transport.accept({ type: 'offer', sdp: 'their-offer' });
      await flush();
      transport.accept({ type: 'offer', sdp: 'their-offer' });
      await flush();

      expect(pc.signalingState).toBe('stable');
      expect(signalsOfType(events, 'answer')).toHaveLength(2);
    });

    test('swallows an answer the connection has no use for', async () => {
      const { transport, pc } = open();

      transport.accept({ type: 'answer', sdp: 'stray-answer' });
      await flush();

      expect(pc.signalingState).toBe('stable');
      expect(pc.remoteDescription).toBeNull();
    });
  });

  describe('connection state', () => {
    test('reports connected once media can flow', () => {
      const { pc, events } = open();

      pc.connectionState = 'connected';
      pc.dispatch('connectionstatechange');

      expect(events.onConnected).toHaveBeenCalledTimes(1);
    });

    // ICE can be connected while DTLS fails, so this is not the same signal as a
    // failed ICE state — and it was previously reported by nothing at all.
    test('reports a failed connection as an error', () => {
      const { pc, events } = open();

      pc.connectionState = 'failed';
      pc.dispatch('connectionstatechange');

      expect(events.onError).toHaveBeenCalledWith(expect.any(Error));
      expect(events.onConnected).not.toHaveBeenCalled();
    });

    test('forwards ICE state changes without interpreting them', () => {
      const { pc, events } = open();

      pc.iceConnectionState = 'checking';
      pc.dispatch('iceconnectionstatechange');
      pc.iceConnectionState = 'failed';
      pc.dispatch('iceconnectionstatechange');

      expect(vi.mocked(events.onIceStateChange).mock.calls).toEqual([['checking'], ['failed']]);
    });

    // A failed connection is torn down and redialled by the caller. A merely
    // disconnected one is worth trying to save, and nothing used to try.
    test('restarts ICE when the connection drops but not when it fails', () => {
      const { pc } = open();

      pc.iceConnectionState = 'disconnected';
      pc.dispatch('iceconnectionstatechange');
      expect(pc.restartIce).toHaveBeenCalledTimes(1);

      pc.iceConnectionState = 'failed';
      pc.dispatch('iceconnectionstatechange');
      expect(pc.restartIce).toHaveBeenCalledTimes(1);
    });

    test('reports remote media under the stream the far side sent', () => {
      const { pc, events } = open();
      const remote = streamOf([track('video')]);

      pc.dispatch('track', { streams: [remote], track: track('video') });

      expect(events.onStream).toHaveBeenCalledWith(remote);
    });
  });

  describe('closing', () => {
    test('closes the connection and reports it exactly once', () => {
      const { transport, pc, events } = open();

      transport.close();
      transport.close();

      expect(pc.closed).toBe(true);
      expect(events.onClosed).toHaveBeenCalledTimes(1);
      expect(transport.closed).toBe(true);
    });

    // The store's `dropPeer` removes the peer from its map, calls `close()`, and
    // re-enters through `onClosed` — which only terminates because the callback
    // has already run by the time `close()` returns. A deferred `onClosed` would
    // book a second retry for one failure and make a `closed` peer observable in
    // the store's map, so the timing is contract, not implementation detail.
    test('reports the close synchronously, before close() returns', () => {
      const { transport, events } = open();
      let closedWhileClosing = false;

      (events.onClosed as ReturnType<typeof vi.fn>).mockImplementation(() => {
        closedWhileClosing = transport.closed;
      });

      transport.close();

      expect(events.onClosed).toHaveBeenCalledTimes(1);
      expect(closedWhileClosing).toBe(true);
    });

    test('ignores signals that arrive after closing', async () => {
      const { transport, pc } = open();

      transport.close();
      transport.accept({ type: 'offer', sdp: 'too-late' });
      await flush();

      expect(pc.remoteDescription).toBeNull();
    });

    test('stops reporting state changes after closing', () => {
      const { transport, pc, events } = open();

      transport.close();
      pc.connectionState = 'connected';
      pc.dispatch('connectionstatechange');
      pc.iceConnectionState = 'failed';
      pc.dispatch('iceconnectionstatechange');

      expect(events.onConnected).not.toHaveBeenCalled();
      expect(events.onIceStateChange).not.toHaveBeenCalled();
    });
  });

  describe('swapping local media', () => {
    test('replaces a track of a kind the connection already carries', () => {
      const { transport, pc } = open();
      const freshVideo = track('video');
      const freshAudio = track('audio');
      const [videoSender, audioSender] = pc.senders;

      transport.replaceLocalTracks(streamOf([freshVideo, freshAudio]));

      expect(videoSender.replaceTrack).toHaveBeenCalledWith(freshVideo);
      expect(audioSender.replaceTrack).toHaveBeenCalledWith(freshAudio);
      expect(pc.senders).toHaveLength(2);
    });

    test('adds a sender for a kind the connection was not carrying', () => {
      localStream = streamOf([video]);
      const { transport, pc } = open();

      transport.replaceLocalTracks(streamOf([audio]));

      expect(pc.senders).toHaveLength(2);
      expect(pc.senders[1].track).toBe(audio);
    });
  });

  test('names the candidate types that carried the connection', async () => {
    const { transport, pc } = open();
    pc.getStats = vi.fn(
      async () =>
        new Map<string, any>([
          ['t', { type: 'transport', selectedCandidatePairId: 'pair' }],
          ['pair', { type: 'candidate-pair', localCandidateId: 'l', remoteCandidateId: 'r' }],
          ['l', { candidateType: 'relay' }],
          ['r', { candidateType: 'srflx' }],
        ])
    );

    await expect(transport.candidateTypes()).resolves.toEqual({ local: 'relay', remote: 'srflx' });
  });

  test('reports no candidate types once closed', async () => {
    const { transport } = open();

    transport.close();

    await expect(transport.candidateTypes()).resolves.toBeNull();
  });
});

describe('shouldIgnoreOffer', () => {
  const base = {
    polite: false,
    makingOffer: false,
    signalingState: 'stable' as RTCSignalingState,
    settingRemoteAnswer: false,
    type: 'offer' as const,
  };

  test('takes an offer when nothing of ours is in flight', () => {
    expect(shouldIgnoreOffer(base)).toBe(false);
  });

  test('only the impolite peer ignores a collision', () => {
    const collision = { ...base, signalingState: 'have-local-offer' as RTCSignalingState };

    expect(shouldIgnoreOffer({ ...collision, polite: false })).toBe(true);
    expect(shouldIgnoreOffer({ ...collision, polite: true })).toBe(false);
  });

  test('an offer we have not sent yet still counts as in flight', () => {
    expect(shouldIgnoreOffer({ ...base, makingOffer: true })).toBe(true);
  });

  // The state is momentarily not stable while an answer is being applied, but it
  // is about to be — treating that as a collision would drop a good offer.
  test('an answer being applied does not count as a collision', () => {
    expect(
      shouldIgnoreOffer({
        ...base,
        signalingState: 'have-local-offer' as RTCSignalingState,
        settingRemoteAnswer: true,
      })
    ).toBe(false);
  });

  test('an answer is never ignored', () => {
    expect(
      shouldIgnoreOffer({
        ...base,
        type: 'answer',
        signalingState: 'have-local-offer' as RTCSignalingState,
      })
    ).toBe(false);
  });
});
