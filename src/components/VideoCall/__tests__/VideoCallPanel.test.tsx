import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import VideoCallPanel from '../VideoCallPanel';
import type { MediaState } from '@/types/videoCall';

// setupTests mocks this module with a Proxy that has no `ownKeys` trap, so the
// namespace Vitest builds from it is empty and every named icon import fails. Naming
// the icons this tree renders is enough, and keeps the global mock alone.
vi.mock('@mui/icons-material', () => ({
  MicOff: () => <div data-testid="mui-icon-micoff" />,
  VideocamOff: () => <div data-testid="mui-icon-videocamoff" />,
  WifiTetheringOff: () => <div data-testid="mui-icon-wifitetheringoff" />,
}));

const storeState = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
const retryPeer = vi.hoisted(() => vi.fn());

vi.mock('@/stores/videoCallStore', async () => {
  const actual =
    await vi.importActual<typeof import('@/stores/videoCallStore')>('@/stores/videoCallStore');
  return {
    ...actual,
    useVideoCallStore: (selector?: (state: unknown) => unknown) =>
      selector ? selector(storeState.current) : storeState.current,
  };
});

vi.mock('@/stores/userListStore', () => ({
  useUser: (uid: string) =>
    uid === 'peer-a' ? { uid: 'peer-a', displayName: 'Robin Vale' } : undefined,
}));

// The controls are their own concern and reach for Firebase auth on mount.
vi.mock('../VideoControls', () => ({
  default: () => <div data-testid="video-controls">Video Controls</div>,
}));

/** A stand-in stream, since jsdom ships no MediaStream. */
function streamWith({ video = false, audio = true } = {}): MediaStream {
  return {
    getVideoTracks: () => (video ? [{ kind: 'video' }] : []),
    getAudioTracks: () => (audio ? [{ kind: 'audio' }] : []),
    getTracks: () => [],
  } as unknown as MediaStream;
}

interface PeerFixture {
  stream?: MediaStream;
  connectionState?: RTCPeerConnectionState;
  reconnecting?: boolean;
}

function setStore({
  roster = [] as string[],
  peers = {} as Record<string, PeerFixture>,
  mediaStates = {} as Record<string, MediaState>,
  retries = {} as Record<string, number>,
  localStream = null as MediaStream | null,
  isMuted = false,
  isVideoOff = false,
  hasCamera = true,
  isPageHidden = false,
} = {}) {
  storeState.current = {
    roster: ['me', ...roster],
    userId: 'me',
    peers: new Map(
      Object.entries(peers).map(([id, peer]) => [
        id,
        {
          peer: {},
          stream: peer.stream ?? streamWith(),
          connectionState: peer.connectionState ?? 'connected',
          reconnecting: peer.reconnecting ?? false,
        },
      ])
    ),
    mediaStates: new Map(Object.entries(mediaStates)),
    peerRetries: new Map(
      Object.entries(retries).map(([id, attempts]) => [id, { attempts, nextAttemptAt: 0 }])
    ),
    localStream,
    isMuted,
    isVideoOff,
    hasCamera,
    isPageHidden,
    retryPeer,
  };
}

const tileState = (participantId: string) =>
  screen.getByTestId(`video-tile-${participantId}`).getAttribute('data-state');

describe('VideoCallPanel', () => {
  it('renders a tile for a roster member who has not been dialled yet', () => {
    // Keying off the peer map alone would leave this participant invisible for the
    // whole time they are connecting.
    setStore({ roster: ['peer-a'] });

    render(<VideoCallPanel />);

    expect(tileState('peer-a')).toBe('connecting');
  });

  it('shows a camera-off peer as audio only, with their name', () => {
    setStore({
      roster: ['peer-a'],
      peers: { 'peer-a': { stream: streamWith({ video: false }) } },
      mediaStates: { 'peer-a': { cam: 'off', mic: 'on' } },
    });

    render(<VideoCallPanel />);

    expect(tileState('peer-a')).toBe('audioOnly');
    expect(screen.getByText('Robin Vale')).toBeInTheDocument();
  });

  it('shows video once the camera is published and frames arrive', () => {
    setStore({
      roster: ['peer-a'],
      peers: { 'peer-a': { stream: streamWith({ video: true }) } },
      mediaStates: { 'peer-a': { cam: 'on', mic: 'on' } },
    });

    render(<VideoCallPanel />);

    expect(tileState('peer-a')).toBe('video');
  });

  it('does not call a peer camera-off when it is the connection that is broken', () => {
    setStore({
      roster: ['peer-a'],
      peers: { 'peer-a': { stream: streamWith({ video: false }) } },
      mediaStates: { 'peer-a': { cam: 'on', mic: 'on' } },
    });

    render(<VideoCallPanel />);

    expect(tileState('peer-a')).toBe('connecting');
  });

  it('offers a retry once a peer has exhausted its budget', () => {
    setStore({ roster: ['peer-a'], retries: { 'peer-a': 5 } });

    render(<VideoCallPanel />);

    expect(tileState('peer-a')).toBe('failed');
    fireEvent.click(screen.getByRole('button', { name: 'videoCall.retry' }));

    // Per peer, not a global reconnect, which would tear down the working ones too.
    expect(retryPeer).toHaveBeenCalledWith('peer-a');
  });

  it('puts our own tile last and reads its state locally', () => {
    // Local state, not our own roster write echoing back.
    setStore({
      roster: ['peer-a'],
      peers: { 'peer-a': { stream: streamWith({ video: true }) } },
      mediaStates: { 'peer-a': { cam: 'on', mic: 'on' } },
      localStream: streamWith({ video: false }),
      isVideoOff: true,
      isMuted: true,
    });

    render(<VideoCallPanel showLocalVideo />);

    const tiles = screen.getAllByTestId(/^video-tile-/);
    expect(tiles.map((tile) => tile.getAttribute('data-testid'))).toEqual([
      'video-tile-peer-a',
      'video-tile-local',
    ]);
    expect(tileState('local')).toBe('viewingOnly');
  });

  it('shows both icons when a peer has neither camera nor microphone on', () => {
    // One icon would understate it: "muted" alone reads as a live camera.
    setStore({
      roster: ['peer-a'],
      peers: { 'peer-a': { stream: streamWith({ video: false }) } },
      mediaStates: { 'peer-a': { cam: 'off', mic: 'off' } },
    });

    render(<VideoCallPanel />);

    expect(tileState('peer-a')).toBe('viewingOnly');
    const tile = screen.getByTestId('video-tile-peer-a');
    expect(tile.querySelector('[data-testid="mui-icon-videocamoff"]')).toBeInTheDocument();
    expect(tile.querySelector('[data-testid="mui-icon-micoff"]')).toBeInTheDocument();
  });

  it('leaves an older client that publishes no media state undescribed', () => {
    setStore({
      roster: ['peer-a'],
      peers: { 'peer-a': { stream: streamWith({ video: false }) } },
    });

    render(<VideoCallPanel />);

    expect(tileState('peer-a')).toBe('unknown');
  });

  it('keeps a connected peer visible after their roster entry goes stale', () => {
    // liveRoster drops entries whose heartbeat has aged out, and a backgrounded tab
    // throttles that heartbeat — the exact case `cam: 'hidden'` exists for. Driving
    // the list from the roster alone would make a still-connected peer disappear.
    setStore({
      peers: { 'peer-a': { stream: streamWith({ video: true }) } },
      mediaStates: { 'peer-a': { cam: 'on', mic: 'on' } },
    });

    render(<VideoCallPanel />);

    expect(tileState('peer-a')).toBe('video');
  });

  it('reuses the same video element across a camera toggle', () => {
    // Guards the remount regression: if collapsing moved the participant to a
    // different component, React would discard the <video> and its srcObject, so
    // every camera-on would open on a black frame.
    const withCamera = {
      roster: ['peer-a'],
      peers: { 'peer-a': { stream: streamWith({ video: true }) } },
      mediaStates: { 'peer-a': { cam: 'on' as const, mic: 'on' as const } },
    };
    setStore(withCamera);
    const { rerender } = render(<VideoCallPanel />);
    const before = screen.getByTestId('video-tile-peer-a').querySelector('video');

    setStore({
      roster: ['peer-a'],
      peers: { 'peer-a': { stream: streamWith({ video: false }) } },
      mediaStates: { 'peer-a': { cam: 'off', mic: 'on' } },
    });
    rerender(<VideoCallPanel />);
    expect(tileState('peer-a')).toBe('audioOnly');

    setStore(withCamera);
    rerender(<VideoCallPanel />);

    expect(screen.getByTestId('video-tile-peer-a').querySelector('video')).toBe(before);
  });

  it('renders the controls', () => {
    setStore();

    render(<VideoCallPanel />);

    expect(screen.getByTestId('video-controls')).toBeInTheDocument();
  });
});
