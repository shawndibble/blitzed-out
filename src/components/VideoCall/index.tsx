import { useEffect } from 'react';
import { useCallPresenceStore } from '@/stores/callPresenceStore';

interface VideoCallProviderProps {
  roomId: string;
  children: React.ReactNode;
}

/**
 * Watches who is on the room's video call, without joining it.
 *
 * Read-only by design: the participant badge has to show a number to people who
 * have not joined, and no other code path can supply one — desktop subscribes to
 * nothing until the sidebar opens, mobile not until the Call button is tapped.
 * Claiming a slot here would turn merely entering a room into joining the call.
 */
const VideoCallProvider = ({ roomId, children }: VideoCallProviderProps) => {
  const subscribe = useCallPresenceStore((state) => state.subscribe);
  const unsubscribe = useCallPresenceStore((state) => state.unsubscribe);

  useEffect(() => {
    subscribe(roomId);
    return unsubscribe;
  }, [roomId, subscribe, unsubscribe]);

  return <>{children}</>;
};

export default VideoCallProvider;
