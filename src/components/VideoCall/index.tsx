import { useEffect } from 'react';
import { useVideoCallStore } from '@/stores/videoCallStore';

interface VideoCallProviderProps {
  roomId: string;
  children: React.ReactNode;
}

const VideoCallProvider = ({ roomId, children }: VideoCallProviderProps) => {
  const { initialize, cleanup } = useVideoCallStore();

  useEffect(() => {
    initialize(roomId);

    return () => {
      cleanup();
    };
  }, [roomId, initialize, cleanup]);

  return <>{children}</>;
};

export default VideoCallProvider;
