import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import VideoTile from '../VideoTile';

interface ParticipantData {
  stream: MediaStream;
  isSpeaking: boolean;
  isMuted: boolean;
}

interface VideoGridProps {
  participants: Map<string, ParticipantData>;
}

const VideoGrid = ({ participants }: VideoGridProps) => {
  const { t } = useTranslation();
  const participantCount = participants.size;

  if (participantCount === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          p: 3,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {t('videoCall.waitingForOthers')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2, flexShrink: 0 }}>
        <Typography variant="body2" color="text.secondary">
          {t('videoCall.participantCount', { count: participantCount })}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flexGrow: 1,
          overflowY: 'auto',
        }}
      >
        {Array.from(participants.entries()).map(([participantId, data]) => (
          <VideoTile
            key={participantId}
            stream={data.stream}
            participantId={participantId}
            isSpeaking={data.isSpeaking}
            isMuted={data.isMuted}
          />
        ))}
      </Box>
    </Box>
  );
};

export default VideoGrid;
