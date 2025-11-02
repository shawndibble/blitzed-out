import { Box } from '@mui/material';
import { useVideoCallStore } from '@/stores/videoCallStore';
import VideoGrid from './VideoGrid';
import VideoControls from './VideoControls';

interface VideoCallPanelProps {
  showLocalVideo?: boolean;
  onEndCall?: () => void;
}

const VideoCallPanel = ({ showLocalVideo = false, onEndCall }: VideoCallPanelProps) => {
  const { peers, localStream } = useVideoCallStore();

  const participantsMap = new Map(
    Array.from(peers.entries()).map(([peerId, peerData]) => [
      peerId,
      {
        stream: peerData.stream,
        isSpeaking: false,
        isMuted: false,
      },
    ])
  );

  // Add local video last if requested (so it appears at the bottom)
  if (showLocalVideo && localStream) {
    participantsMap.set('local', {
      stream: localStream,
      isSpeaking: false,
      isMuted: false,
    });
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        p: { xs: 1, sm: 2 }, // Less padding on mobile
        pb: { xs: '70px', sm: 2 }, // Extra padding on mobile to push controls above roll button
      }}
    >
      <Box sx={{ flexGrow: 1, overflow: 'hidden', mb: 2, minHeight: 0 }}>
        <VideoGrid participants={participantsMap} />
      </Box>
      <VideoControls onEndCall={onEndCall} />
    </Box>
  );
};

export default VideoCallPanel;
