import { IconButton, Box, Alert, Collapse } from '@mui/material';
import { Mic, MicOff, Videocam, VideocamOff, CallEnd, Call } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { getAuth } from 'firebase/auth';
import { useVideoCallStore } from '@/stores/videoCallStore';
import { useCallPresenceStore } from '@/stores/callPresenceStore';
import { MAX_CALL_PARTICIPANTS } from '@/config/webrtc';
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
  // Same window the join gate enforces, so the button cannot look available while
  // `initialize` would refuse it.
  const capacityCount = useCallPresenceStore((state) => state.capacityCount);
  const isFull = capacityCount >= MAX_CALL_PARTICIPANTS;

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
          // Tighter on mobile, where this row sits between the nav and the tiles and
          // every pixel it gives back becomes video. The small buttons still clear
          // WCAG 2.2's 24px minimum target.
          p: isMobile ? 0.5 : 2,
          backgroundColor: 'transparent',
        }}
      >
        <IconButton
          size={isMobile ? 'small' : 'medium'}
          onClick={toggleMute}
          aria-label={isMuted ? t('videoCall.unmuteButton') : t('videoCall.muteButton')}
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
          size={isMobile ? 'small' : 'medium'}
          onClick={toggleVideo}
          aria-label={isVideoOff ? t('videoCall.videoOffButton') : t('videoCall.videoOnButton')}
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
          size={isMobile ? 'small' : 'medium'}
          onClick={handleCallToggle}
          // Joining a full call is refused before the camera is touched, which would
          // otherwise make this a button that does nothing at all.
          disabled={isMobile && !isCallActive && isFull}
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
