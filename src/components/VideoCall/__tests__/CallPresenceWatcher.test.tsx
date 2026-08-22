import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import CallPresenceWatcher from '../CallPresenceWatcher';
import { useCallPresenceStore } from '@/stores/callPresenceStore';
import { useVideoCallStore } from '@/stores/videoCallStore';

vi.mock('@/stores/videoCallStore');

describe('CallPresenceWatcher', () => {
  const testChildren = <div data-testid="test-children">Test Children</div>;
  let watch: (roomId: string) => void;
  let stopWatching: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    watch = vi.fn();
    stopWatching = vi.fn();
    useCallPresenceStore.setState({ watch, stopWatching });
  });

  it('watches the room it was given', () => {
    render(<CallPresenceWatcher roomId="test-room">{testChildren}</CallPresenceWatcher>);

    expect(watch).toHaveBeenCalledWith('test-room');
  });

  // The badge must be readable by people who have not joined, so entering a room
  // may never claim a slot or touch the camera. Regression guard: this provider
  // used to auto-join, and was inert only because of where it was mounted.
  it('never joins the call', () => {
    render(<CallPresenceWatcher roomId="test-room">{testChildren}</CallPresenceWatcher>);

    expect(vi.mocked(useVideoCallStore)).not.toHaveBeenCalled();
  });

  it('stops watching on unmount', () => {
    const { unmount } = render(
      <CallPresenceWatcher roomId="test-room">{testChildren}</CallPresenceWatcher>
    );

    unmount();

    expect(stopWatching).toHaveBeenCalled();
  });

  it('follows a room change', () => {
    const { rerender } = render(
      <CallPresenceWatcher roomId="room-1">{testChildren}</CallPresenceWatcher>
    );

    rerender(<CallPresenceWatcher roomId="room-2">{testChildren}</CallPresenceWatcher>);

    expect(watch).toHaveBeenLastCalledWith('room-2');
  });

  it('renders children', () => {
    const { getByTestId } = render(
      <CallPresenceWatcher roomId="test-room">{testChildren}</CallPresenceWatcher>
    );

    expect(getByTestId('test-children')).toBeInTheDocument();
  });
});
