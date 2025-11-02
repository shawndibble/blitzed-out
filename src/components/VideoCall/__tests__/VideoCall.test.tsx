import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import VideoCallProvider from '../index';
import { useVideoCallStore } from '@/stores/videoCallStore';

vi.mock('@/stores/videoCallStore');

describe('VideoCallProvider', () => {
  const mockInitialize = vi.fn();
  const mockCleanup = vi.fn();
  const testChildren = <div data-testid="test-children">Test Children</div>;

  beforeEach(() => {
    vi.clearAllMocks();
    (useVideoCallStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      localStream: null,
      peers: new Map(),
      isInitialized: false,
      initialize: mockInitialize,
      cleanup: mockCleanup,
    });
  });

  it('initializes video call on mount', () => {
    render(<VideoCallProvider roomId="test-room">{testChildren}</VideoCallProvider>);

    expect(mockInitialize).toHaveBeenCalledWith('test-room');
  });

  it('cleans up on unmount', () => {
    const { unmount } = render(
      <VideoCallProvider roomId="test-room">{testChildren}</VideoCallProvider>
    );

    unmount();

    expect(mockCleanup).toHaveBeenCalled();
  });

  it('reinitializes when roomId changes', () => {
    const { rerender } = render(
      <VideoCallProvider roomId="room-1">{testChildren}</VideoCallProvider>
    );

    mockInitialize.mockClear();

    rerender(<VideoCallProvider roomId="room-2">{testChildren}</VideoCallProvider>);

    expect(mockCleanup).toHaveBeenCalled();
    expect(mockInitialize).toHaveBeenCalledWith('room-2');
  });

  it('renders children', () => {
    const { getByTestId } = render(
      <VideoCallProvider roomId="test-room">{testChildren}</VideoCallProvider>
    );

    expect(getByTestId('test-children')).toBeInTheDocument();
  });
});
