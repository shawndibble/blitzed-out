import { IconButton, Box } from '@mui/material';
import { Mic, MicOff, Videocam, VideocamOff, CallEnd, Call } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useVideoCallStore } from '@/stores/videoCallStore';
import useBreakpoint from '@/hooks/useBreakpoint';

interface VideoControlsProps {
  onEndCall?: () => void;
}

const VideoControls = ({ onEndCall }: VideoControlsProps) => {
  const { t } = useTranslation();
  const isMobile = useBreakpoint();
  const {
    isMuted,
    isVideoOff,
    isCallActive,
    toggleMute,
    toggleVideo,
    disconnectCall,
    reconnectCall,
  } = useVideoCallStore();

  const handleCallToggle = () => {
    if (isMobile) {
      if (isCallActive) {
        disconnectCall();
      } else {
        reconnectCall();
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
