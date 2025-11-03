import { IconButton, Box, Alert, Collapse } from '@mui/material';
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
    error,
    toggleMute,
    toggleVideo,
    disconnectCall,
    reconnectCall,
    initialize,
    clearError,
  } = useVideoCallStore();

  const handleCallToggle = async () => {
    if (isMobile) {
      if (isCallActive) {
        disconnectCall();
      } else {
        if (!isInitialized && roomId) {
          const auth = getAuth();
          const userId = auth.currentUser?.uid;
          if (userId) {
            try {
              await initialize(roomId, userId);
            } catch {
              // Error is stored in state, no need to handle here
            }
          }
        } else {
          try {
            await reconnectCall();
          } catch {
            // Error is stored in state, no need to handle here
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
        flexDirection: 'column',
        gap: 1,
        alignItems: 'center',
      }}
    >
      <Collapse in={!!error} sx={{ width: '100%' }}>
        <Alert severity="error" onClose={clearError} sx={{ mb: 1 }}>
          {error && t(error.message)}
        </Alert>
      </Collapse>
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
    </Box>
  );
};

export default VideoControls;
