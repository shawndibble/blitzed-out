import { useState, useEffect } from 'react';
import { setMyPresence } from '@/services/firebase';
import useAuth from '@/context/hooks/useAuth';

export default function usePresence(roomId, roomRealtime) {
  const {
    user: { displayName },
  } = useAuth();

  const [currentRoom, setCurrentRoom] = useState(null);
  const [currentDisplayName, setCurrentDisplayName] = useState(displayName);

  useEffect(() => {
    if (currentRoom !== roomId || displayName !== currentDisplayName) {
      setMyPresence({
        newRoom: roomId,
        oldRoom: currentRoom,
        newDisplayName: displayName,
        oldDisplayName: currentDisplayName,
        removeOnDisconnect: roomRealtime || roomId.toUpperCase() === 'PUBLIC',
      });
      setCurrentRoom(roomId);
      setCurrentDisplayName(displayName);
    }
  }, [roomId, displayName, currentRoom, currentDisplayName]);
}
