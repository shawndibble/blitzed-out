import { useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { useVideoCallStore } from '@/stores/videoCallStore';
import useBreakpoint from '@/hooks/useBreakpoint';

interface VideoCallProviderProps {
  roomId: string;
  children: React.ReactNode;
}

const VideoCallProvider = ({ roomId, children }: VideoCallProviderProps) => {
  const { initialize, cleanup } = useVideoCallStore();
  const isMobile = useBreakpoint();

  useEffect(() => {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    // Only auto-initialize on desktop, mobile requires explicit call button click
    if (userId && !isMobile) {
      initialize(roomId, userId);
    }

    return () => {
      cleanup();
    };
  }, [roomId, initialize, cleanup, isMobile]);

  return <>{children}</>;
};

export default VideoCallProvider;
