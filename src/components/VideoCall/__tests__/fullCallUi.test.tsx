import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MAX_CALL_PARTICIPANTS } from '@/config/webrtc';
import { useCallPresenceStore } from '@/stores/callPresenceStore';
import VideoGrid from '../VideoGrid';
import VideoControls from '../VideoControls';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@mui/icons-material', () => ({
  Mic: () => <div />,
  MicOff: () => <div />,
  Videocam: () => <div />,
  VideocamOff: () => <div />,
  Call: () => <div />,
  CallEnd: () => <div />,
}));

vi.mock('firebase/auth', () => ({ getAuth: vi.fn(() => ({ currentUser: { uid: 'me' } })) }));

vi.mock('@/hooks/useBreakpoint', () => ({ default: () => true }));

const storeState = {
  isMuted: false,
  isVideoOff: false,
  isCallActive: false,
  isInitialized: false,
  error: null,
  toggleMute: vi.fn(),
  toggleVideo: vi.fn(),
  disconnectCall: vi.fn(),
  reconnectCall: vi.fn(),
  initialize: vi.fn(),
  clearError: vi.fn(),
};

vi.mock('@/stores/videoCallStore', () => ({
  useVideoCallStore: () => storeState,
  MAX_RETRY_ATTEMPTS: 5,
}));

function presenceAt(capacityCount: number) {
  useCallPresenceStore.setState({ count: capacityCount, capacityCount, loaded: true });
}

describe('A full call', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCallPresenceStore.setState({ count: 0, capacityCount: 0, loaded: false });
    storeState.isCallActive = false;
  });

  // The join is refused before the camera is touched, so an enabled button would
  // do nothing at all when tapped.
  test('disables the join control', () => {
    presenceAt(MAX_CALL_PARTICIPANTS);
    render(<VideoControls roomId="PUBLIC" />);

    expect(screen.getByRole('button', { name: 'videoCall.startCall' })).toBeDisabled();
  });

  test('leaves the join control alone below the cap', () => {
    presenceAt(MAX_CALL_PARTICIPANTS - 1);
    render(<VideoControls roomId="PUBLIC" />);

    expect(screen.getByRole('button', { name: 'videoCall.startCall' })).toBeEnabled();
  });

  // Gating on the badge's window would leave this enabled while `initialize`
  // refused the tap, because a backgrounded participant is missing from `count`.
  test('disables the join control on a slot only the mesh still sees', () => {
    useCallPresenceStore.setState({
      count: MAX_CALL_PARTICIPANTS - 2,
      capacityCount: MAX_CALL_PARTICIPANTS,
      loaded: true,
    });
    render(<VideoControls roomId="PUBLIC" />);

    expect(screen.getByRole('button', { name: 'videoCall.startCall' })).toBeDisabled();
  });

  // A refused joiner has an empty participant map, so the grid would otherwise say
  // the call is empty directly under an alert saying it is full.
  test('says nothing rather than "waiting for others"', () => {
    render(<VideoGrid participants={new Map()} isWaiting={false} />);

    expect(screen.queryByText('videoCall.waitingForOthers')).not.toBeInTheDocument();
  });

  test('still waits for others when you are actually in the call', () => {
    render(<VideoGrid participants={new Map()} />);

    expect(screen.getByText('videoCall.waitingForOthers')).toBeInTheDocument();
  });
});
