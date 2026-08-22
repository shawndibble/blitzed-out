import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import VideoCallProvider from '../index';
import { useCallPresenceStore } from '@/stores/callPresenceStore';
import { useVideoCallStore } from '@/stores/videoCallStore';

vi.mock('@/stores/videoCallStore');

describe('VideoCallProvider', () => {
  const testChildren = <div data-testid="test-children">Test Children</div>;
  let subscribe: (roomId: string) => void;
  let unsubscribe: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    subscribe = vi.fn();
    unsubscribe = vi.fn();
    useCallPresenceStore.setState({ subscribe, unsubscribe });
  });

  it('watches the room it was given', () => {
    render(<VideoCallProvider roomId="test-room">{testChildren}</VideoCallProvider>);

    expect(subscribe).toHaveBeenCalledWith('test-room');
  });

  // The badge must be readable by people who have not joined, so entering a room
  // may never claim a slot or touch the camera. Regression guard: this provider
  // used to auto-join, and was inert only because of where it was mounted.
  it('never joins the call', () => {
    render(<VideoCallProvider roomId="test-room">{testChildren}</VideoCallProvider>);

    expect(vi.mocked(useVideoCallStore)).not.toHaveBeenCalled();
  });

  it('stops watching on unmount', () => {
    const { unmount } = render(
      <VideoCallProvider roomId="test-room">{testChildren}</VideoCallProvider>
    );

    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });

  it('follows a room change', () => {
    const { rerender } = render(
      <VideoCallProvider roomId="room-1">{testChildren}</VideoCallProvider>
    );

    rerender(<VideoCallProvider roomId="room-2">{testChildren}</VideoCallProvider>);

    expect(subscribe).toHaveBeenLastCalledWith('room-2');
  });

  it('renders children', () => {
    const { getByTestId } = render(
      <VideoCallProvider roomId="test-room">{testChildren}</VideoCallProvider>
    );

    expect(getByTestId('test-children')).toBeInTheDocument();
  });
});
