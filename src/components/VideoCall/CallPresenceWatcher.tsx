import { useEffect } from 'react';
import { useCallPresenceStore } from '@/stores/callPresenceStore';

interface CallPresenceWatcherProps {
  roomId: string;
  children: React.ReactNode;
}

/**
 * Watches who is on the room's video call, without joining it.
 *
 * Read-only by design: the participant badge has to show a number to people who
 * have not joined, and no other code path can supply one — desktop subscribes to
 * nothing until the sidebar opens, mobile not until the Call button is tapped.
 * Claiming a slot here would turn entering a room into joining the call.
 */
const CallPresenceWatcher = ({ roomId, children }: CallPresenceWatcherProps) => {
  const watch = useCallPresenceStore((state) => state.watch);
  const stopWatching = useCallPresenceStore((state) => state.stopWatching);

  useEffect(() => {
    watch(roomId);
    return stopWatching;
  }, [roomId, watch, stopWatching]);

  return <>{children}</>;
};

export default CallPresenceWatcher;
