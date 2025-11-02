import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import VideoTile from '../index';

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

describe('VideoTile', () => {
  let mockStream: MediaStream;

  beforeEach(() => {
    mockStream = {
      getTracks: vi.fn(() => []),
      getVideoTracks: vi.fn(() => [{ enabled: true }]),
      getAudioTracks: vi.fn(() => [{ enabled: true }]),
    } as unknown as MediaStream;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders video element with stream', () => {
    const { container } = render(
      <VideoTile stream={mockStream} participantId="test-user" isSpeaking={false} isMuted={false} />
    );

    const videoElement = container.querySelector('video');
    expect(videoElement).toBeInTheDocument();
    expect(videoElement).toHaveAttribute('autoplay');
    expect(videoElement).toHaveAttribute('playsInline');
  });

  it('shows speaking indicator when participant is speaking', () => {
    render(
      <VideoTile stream={mockStream} participantId="test-user" isSpeaking={true} isMuted={false} />
    );

    const tile = screen.getByTestId('video-tile-test-user');
    expect(tile).toHaveStyle({ border: expect.stringContaining('3px') });
  });

  it('shows muted indicator when participant is muted', () => {
    render(
      <VideoTile stream={mockStream} participantId="test-user" isSpeaking={false} isMuted={true} />
    );

    expect(screen.getByLabelText(/muted/i)).toBeInTheDocument();
  });

  it('has correct dimensions (150x112px)', () => {
    render(
      <VideoTile stream={mockStream} participantId="test-user" isSpeaking={false} isMuted={false} />
    );

    const tile = screen.getByTestId('video-tile-test-user');
    const styles = window.getComputedStyle(tile);
    expect(styles.width).toBe('150px');
    expect(styles.height).toBe('112px');
  });

  it('stops video tracks on unmount', () => {
    const mockStop = vi.fn();
    const mockTrack = { stop: mockStop, enabled: true };
    mockStream.getTracks = vi.fn(() => [mockTrack as unknown as MediaStreamTrack]);

    const { unmount } = render(
      <VideoTile stream={mockStream} participantId="test-user" isSpeaking={false} isMuted={false} />
    );

    unmount();

    expect(mockStop).toHaveBeenCalled();
  });

  it('displays camera off indicator when video track is disabled', () => {
    mockStream.getVideoTracks = vi.fn(() => [{ enabled: false }] as unknown as MediaStreamTrack[]);

    render(
      <VideoTile stream={mockStream} participantId="test-user" isSpeaking={false} isMuted={false} />
    );

    expect(screen.getByLabelText(/camera off/i)).toBeInTheDocument();
  });

  it('sets video element srcObject to stream', () => {
    const { container } = render(
      <VideoTile stream={mockStream} participantId="test-user" isSpeaking={false} isMuted={false} />
    );

    const videoElement = container.querySelector('video') as HTMLVideoElement;
    expect(videoElement.srcObject).toBe(mockStream);
  });
});
