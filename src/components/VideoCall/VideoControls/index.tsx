import { IconButton, Box } from '@mui/material';
import { Mic, MicOff, Videocam, VideocamOff, CallEnd, Call } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { getAuth } from 'firebase/auth';
import { useVideoCallStore } from '@/stores/videoCallStore';
import useBreakpoint from '@/hooks/useBreakpoint';

interface VideoControlsProps {
  roomId?: string;
  onEndCall?: () => void;
}

const VideoControls = ({ roomId, onEndCall }: VideoControlsProps) => {
  const { t } = useTranslation();
  const isMobile = useBreakpoint();
  const {
    isMuted,
    isVideoOff,
    isCallActive,
    isInitialized,
    toggleMute,
    toggleVideo,
    disconnectCall,
    reconnectCall,
    initialize,
  } = useVideoCallStore();

  const handleCallToggle = async () => {
    console.log('Call button clicked', { isMobile, isCallActive, isInitialized, roomId });

    if (isMobile) {
      if (isCallActive) {
        console.log('Disconnecting call');
        disconnectCall();
      } else {
        // If not initialized yet, initialize first (first time call on mobile)
        if (!isInitialized && roomId) {
          const auth = getAuth();
          const userId = auth.currentUser?.uid;
          console.log('Attempting to initialize', { roomId, userId });
          if (userId) {
            try {
              await initialize(roomId, userId);
              console.log('Initialize completed');
            } catch (error) {
              console.error('Failed to initialize video call:', error);
            }
          } else {
            console.error('No userId found');
          }
        } else {
          console.log('Attempting to reconnect', { isInitialized });
          try {
            await reconnectCall();
            console.log('Reconnect completed');
          } catch (error) {
            console.error('Failed to reconnect video call:', error);
          }
        }
      }
    } else {
      onEndCall?.();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        justifyContent: 'center',
        alignItems: 'center',
        p: 2,
        backgroundColor: 'transparent',
      }}
    >
      <IconButton
        onClick={toggleMute}
        aria-label={isMuted ? t('videoCall.muteButton') : t('videoCall.unmuteButton')}
        disabled={!isCallActive}
        sx={{
          bgcolor: isMuted ? 'error.main' : 'action.hover',
          '&:hover': {
            bgcolor: isMuted ? 'error.dark' : 'action.selected',
          },
        }}
      >
        {isMuted ? <MicOff /> : <Mic />}
      </IconButton>

      <IconButton
        onClick={toggleVideo}
        aria-label={isVideoOff ? t('videoCall.videoOnButton') : t('videoCall.videoOffButton')}
        disabled={!isCallActive}
        sx={{
          bgcolor: isVideoOff ? 'error.main' : 'action.hover',
          '&:hover': {
            bgcolor: isVideoOff ? 'error.dark' : 'action.selected',
          },
        }}
      >
        {isVideoOff ? <VideocamOff /> : <Videocam />}
      </IconButton>

      <IconButton
        onClick={handleCallToggle}
        aria-label={
          isMobile && !isCallActive ? t('videoCall.startCall') : t('videoCall.endCallButton')
        }
        sx={{
          bgcolor: isMobile && !isCallActive ? 'success.main' : 'error.main',
          color: isMobile && !isCallActive ? 'success.contrastText' : 'error.contrastText',
          '&:hover': {
            bgcolor: isMobile && !isCallActive ? 'success.dark' : 'error.dark',
          },
        }}
      >
        {isMobile && !isCallActive ? <Call /> : <CallEnd />}
      </IconButton>
    </Box>
  );
};

export default VideoControls;
