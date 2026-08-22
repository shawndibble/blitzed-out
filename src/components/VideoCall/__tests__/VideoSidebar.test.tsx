import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useCallPresenceStore } from '@/stores/callPresenceStore';
import VideoSidebar from '../VideoSidebar';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options?.count === undefined ? key : `${key}:${options.count}`,
  }),
}));

// The global icon Proxy in setupTests has no `has` trap, so Vitest's export check
// rejects it. Same local shim the sibling panel test uses.
vi.mock('@mui/icons-material', () => ({
  Videocam: () => <div data-testid="mui-icon-videocam" />,
  VideocamOff: () => <div data-testid="mui-icon-videocamoff" />,
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: { uid: 'me' } })),
}));

vi.mock('../VideoCallPanel', () => ({
  default: () => <div data-testid="video-call-panel" />,
}));

vi.mock('@/stores/videoCallStore', () => ({
  useVideoCallStore: () => ({
    initialize: vi.fn(),
    cleanup: vi.fn(),
    isInitialized: false,
  }),
}));

function presenceAt(count: number) {
  useCallPresenceStore.setState({ count, loaded: true });
}

describe('VideoSidebar participant badge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCallPresenceStore.setState({ count: 0, loaded: false });
  });

  test('shows nothing when nobody is on the call', () => {
    render(<VideoSidebar roomId="PUBLIC" />);

    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  // Counting yourself is what makes a lone caller visible to the rest of the
  // room, which is the point of advertising the number at all.
  test('shows a lone participant', () => {
    presenceAt(1);
    render(<VideoSidebar roomId="PUBLIC" />);

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('shows the live count', () => {
    presenceAt(3);
    render(<VideoSidebar roomId="PUBLIC" />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  // `aria-label` on the button would otherwise hide the badge's number, which is
  // the only place the count is rendered.
  test('names the count for screen readers', () => {
    presenceAt(2);
    render(<VideoSidebar roomId="PUBLIC" />);

    expect(screen.getByRole('button', { name: /videoCall\.onCall:2/ })).toBeInTheDocument();
  });

  test('leaves the label alone at zero', () => {
    render(<VideoSidebar roomId="PUBLIC" />);

    expect(screen.getByRole('button', { name: 'Open video sidebar' })).toBeInTheDocument();
  });
});
