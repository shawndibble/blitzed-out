import { useState, useEffect } from 'react';
import { setMyPresence, startPresenceHeartbeat, removeMyPresence } from '@/services/presence';
import useAuth from '@/context/hooks/useAuth';

export default function usePresence(roomId: string, roomRealtime?: boolean): void {
  const {
    user: { displayName },
  } = useAuth();

  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [currentDisplayName, setCurrentDisplayName] = useState<string>(displayName || '');

  // Set up presence when room or display name changes, then start heartbeat
  useEffect(() => {
    let stopHeartbeat: (() => void) | null = null;

    if (currentRoom !== roomId || displayName !== currentDisplayName) {
      // Set presence first
      setMyPresence({
        newRoom: roomId,
        oldRoom: currentRoom,
        newDisplayName: displayName || '',
        removeOnDisconnect: roomRealtime || roomId?.toUpperCase() === 'PUBLIC',
      })
        .then(() => {
          // Start heartbeat after presence is set
          if (roomId) {
            stopHeartbeat = startPresenceHeartbeat();
          }
        })
        .catch((error) => {
          console.error('Failed to set presence:', error);
        });

      setCurrentRoom(roomId);
      setCurrentDisplayName(displayName || '');
    } else if (roomId && !stopHeartbeat) {
      // If room/name haven't changed but we need heartbeat, start it
      stopHeartbeat = startPresenceHeartbeat();
    }

    // Cleanup function
    return () => {
      if (stopHeartbeat) {
        stopHeartbeat();
      }
    };
  }, [roomId, displayName, currentRoom, currentDisplayName, roomRealtime]);

  // Cleanup on component unmount
  useEffect(() => {
    // Set up cleanup on page unload
    const handleBeforeUnload = () => {
      removeMyPresence();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      removeMyPresence();
    };
  }, []);
}
