import { useState, useEffect, useRef } from 'react';
import { setMyPresence, startPresenceHeartbeat, removeMyPresence } from '@/services/presence';
import useAuth from '@/context/hooks/useAuth';

export default function usePresence(roomId: string, roomRealtime?: boolean): void {
  const {
    user: { displayName },
  } = useAuth();

  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [currentDisplayName, setCurrentDisplayName] = useState<string>(displayName || '');
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set up presence when room or display name changes
  useEffect(() => {
    if (currentRoom !== roomId || displayName !== currentDisplayName) {
      setMyPresence({
        newRoom: roomId,
        oldRoom: currentRoom,
        newDisplayName: displayName || '',
        removeOnDisconnect: roomRealtime || roomId?.toUpperCase() === 'PUBLIC',
      });
      setCurrentRoom(roomId);
      setCurrentDisplayName(displayName || '');
    }
  }, [roomId, displayName, currentRoom, currentDisplayName, roomRealtime]);

  // Set up heartbeat to prevent server-side cleanup
  useEffect(() => {
    let stopHeartbeat: (() => void) | null = null;

    if (roomId) {
      stopHeartbeat = startPresenceHeartbeat();
    }

    // Cleanup function
    return () => {
      if (stopHeartbeat) {
        stopHeartbeat();
      }
    };
  }, [roomId]);

  // Cleanup on component unmount
  useEffect(() => {
    // Set up cleanup on page unload
    const handleBeforeUnload = () => {
      removeMyPresence();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Clean up heartbeat interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      window.removeEventListener('beforeunload', handleBeforeUnload);
      removeMyPresence();
    };
  }, []);
}
