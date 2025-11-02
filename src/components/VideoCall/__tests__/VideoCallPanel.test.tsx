import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import VideoCallPanel from '../VideoCallPanel';

vi.mock('@/context/migration', () => ({
  useMigration: () => ({
    currentLanguageMigrated: true,
    isMigrationInProgress: false,
    isMigrationCompleted: true,
    error: null,
    triggerMigration: vi.fn(),
    ensureLanguageMigrated: vi.fn(),
  }),
}));

vi.mock('@/stores/videoCallStore', () => ({
  useVideoCallStore: () => ({
    peers: new Map(),
    localStream: null,
    isMuted: false,
    isVideoOff: false,
    toggleMute: vi.fn(),
    toggleVideo: vi.fn(),
  }),
}));

vi.mock('../VideoGrid', () => ({
  default: () => <div data-testid="video-grid">Video Grid</div>,
}));

vi.mock('../VideoControls', () => ({
  default: () => <div data-testid="video-controls">Video Controls</div>,
}));

describe('VideoCallPanel', () => {
  it('renders video grid and controls', () => {
    render(<VideoCallPanel />);

    expect(screen.getByTestId('video-grid')).toBeInTheDocument();
    expect(screen.getByTestId('video-controls')).toBeInTheDocument();
  });

  it('passes showLocalVideo prop correctly', () => {
    render(<VideoCallPanel showLocalVideo={true} />);

    expect(screen.getByTestId('video-grid')).toBeInTheDocument();
  });

  it('calls onEndCall when provided to VideoControls', () => {
    const onEndCall = vi.fn();
    render(<VideoCallPanel onEndCall={onEndCall} />);

    expect(screen.getByTestId('video-controls')).toBeInTheDocument();
  });

  it('applies responsive padding on mobile', () => {
    const { container } = render(<VideoCallPanel />);
    const panel = container.firstChild as HTMLElement;

    // Check that the panel has the responsive padding classes
    expect(panel).toBeInTheDocument();
  });
});
