import { useState, useEffect } from 'react';
import { setMyPresence } from '@/services/firebase';
import useAuth from '@/context/hooks/useAuth';

export default function usePresence(roomId: string, roomRealtime?: boolean): void {
  const {
    user: { displayName },
  } = useAuth();

  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [currentDisplayName, setCurrentDisplayName] = useState<string>(displayName || '');

  useEffect(() => {
    if (currentRoom !== roomId || displayName !== currentDisplayName) {
      setMyPresence({
        newRoom: roomId,
        oldRoom: currentRoom,
        newDisplayName: displayName || '',
        oldDisplayName: currentDisplayName,
        removeOnDisconnect: roomRealtime || roomId.toUpperCase() === 'PUBLIC',
      });
      setCurrentRoom(roomId);
      setCurrentDisplayName(displayName || '');
    }
  }, [roomId, displayName, currentRoom, currentDisplayName, roomRealtime]);
}
