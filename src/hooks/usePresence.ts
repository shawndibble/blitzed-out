import { useEffect, useRef } from 'react';
import { setMyPresence, startPresenceHeartbeat, removeMyPresence } from '@/services/presence';
import useAuth from '@/context/hooks/useAuth';

export default function usePresence(roomId: string, roomRealtime?: boolean): void {
  const {
    user: { displayName },
  } = useAuth();

  const currentRoomRef = useRef<string | null>(null);
  const currentDisplayNameRef = useRef<string>(displayName || '');

  // Set up presence when room or display name changes, then start heartbeat
  useEffect(() => {
    let stopHeartbeat: (() => void) | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    const needsPresenceUpdate =
      currentRoomRef.current !== roomId || displayName !== currentDisplayNameRef.current;

    if (needsPresenceUpdate) {
      const oldRoom = currentRoomRef.current;
      currentRoomRef.current = roomId;
      currentDisplayNameRef.current = displayName || '';

      setMyPresence({
        newRoom: roomId,
        oldRoom,
        newDisplayName: displayName || '',
        removeOnDisconnect: roomRealtime || roomId?.toUpperCase() === 'PUBLIC',
      })
        .then(() => {
          if (roomId) {
            // Add a small delay to ensure Firebase write has propagated before starting heartbeat
            timeoutId = setTimeout(() => {
              stopHeartbeat = startPresenceHeartbeat();
            }, 100);
          }
        })
        .catch((error) => {
          console.error('Failed to set presence:', error);
        });
    } else if (roomId && !stopHeartbeat) {
      stopHeartbeat = startPresenceHeartbeat();
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (stopHeartbeat) {
        stopHeartbeat();
      }
    };
  }, [roomId, displayName, roomRealtime]);

  // Set up cleanup on page unload only
  // Note: We don't call removeMyPresence in the cleanup function because
  // React 18 Strict Mode double-mounts components, which would remove presence immediately
  useEffect(() => {
    const handleBeforeUnload = () => {
      removeMyPresence();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
}
