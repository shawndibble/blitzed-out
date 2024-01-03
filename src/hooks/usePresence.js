import { useState, useEffect } from 'react';
import { setMyPresence } from 'services/firebase';
import useAuth from './useAuth';

export default function usePresence(roomId) {
  const { user: { displayName } } = useAuth();

  const [currentRoom, setCurrentRoom] = useState(null);
  const [currentDisplayName, setCurrentDisplayName] = useState(displayName);

  useEffect(() => {
    if (currentRoom !== roomId || displayName !== currentDisplayName) {
      setMyPresence({
        newRoom: roomId,
        oldRoom: currentRoom,
        newDisplayName: displayName,
        oldDisplayName: currentDisplayName,
      });
      setCurrentRoom(roomId);
      setCurrentDisplayName(displayName);
    }
  }, [roomId, displayName, currentRoom, currentDisplayName]);
}
