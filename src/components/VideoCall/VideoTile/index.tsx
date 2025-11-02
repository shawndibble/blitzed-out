import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { MicOff, VideocamOff } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface VideoTileProps {
  stream: MediaStream;
  participantId: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isLocal?: boolean;
}

const VideoTile = ({
  stream,
  participantId,
  isSpeaking,
  isMuted,
  isLocal = false,
}: VideoTileProps) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (videoElement && stream) {
      const hasValidTracks =
        stream.getVideoTracks().length > 0 || stream.getAudioTracks().length > 0;

      if (hasValidTracks) {
        const oldStream = videoElement.srcObject as MediaStream | null;
        if (oldStream && oldStream !== stream) {
          videoElement.srcObject = null;
        }

        videoElement.srcObject = stream;
      } else {
        videoElement.srcObject = null;
      }
    }

    return () => {
      if (videoElement) {
        const currentStream = videoElement.srcObject as MediaStream | null;
        if (currentStream) {
          videoElement.srcObject = null;
        }
      }
    };
  }, [stream, participantId]);

  const videoTrack = stream?.getVideoTracks()[0];
  const isVideoOff = !videoTrack || !videoTrack.enabled;

  return (
    <Box
      data-testid={`video-tile-${participantId}`}
      sx={{
        position: 'relative',
        width: '100%',
        paddingTop: '75%', // 4:3 aspect ratio (112/150 = 0.747, close to 75%)
        borderRadius: 1,
        overflow: 'hidden',
        border: isSpeaking ? '3px solid green' : '1px solid',
        borderColor: isSpeaking ? 'success.main' : 'divider',
        backgroundColor: 'background.default',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {isMuted && (
        <Box
          aria-label={t('videoCall.muted')}
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '50%',
            p: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MicOff fontSize="small" sx={{ color: 'error.main' }} />
        </Box>
      )}

      {isVideoOff && (
        <Box
          aria-label={t('videoCall.cameraOff')}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <VideocamOff fontSize="large" sx={{ color: 'text.secondary' }} />
        </Box>
      )}
    </Box>
  );
};

export default VideoTile;
