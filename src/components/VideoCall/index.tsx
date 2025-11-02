import { useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { useVideoCallStore } from '@/stores/videoCallStore';

interface VideoCallProviderProps {
  roomId: string;
  children: React.ReactNode;
}

const VideoCallProvider = ({ roomId, children }: VideoCallProviderProps) => {
  const { initialize, cleanup } = useVideoCallStore();

  useEffect(() => {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    if (userId) {
      initialize(roomId, userId);
    }

    return () => {
      cleanup();
    };
  }, [roomId, initialize, cleanup]);

  return <>{children}</>;
};

export default VideoCallProvider;
