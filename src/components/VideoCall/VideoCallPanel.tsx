import { useMemo } from 'react';
import { Box } from '@mui/material';
import { useVideoCallStore } from '@/stores/videoCallStore';
import VideoGrid from './VideoGrid';
import VideoControls from './VideoControls';

interface VideoCallPanelProps {
  showLocalVideo?: boolean;
  onEndCall?: () => void;
}

const VideoCallPanel = ({ showLocalVideo = false, onEndCall }: VideoCallPanelProps) => {
  const peers = useVideoCallStore((state) => state.peers);
  const localStream = useVideoCallStore((state) => state.localStream);

  const participantsMap = useMemo(() => {
    const map = new Map(
      Array.from(peers.entries())
        .filter(([, peerData]) => {
          const stream = peerData.stream;
          return (
            stream && (stream.getVideoTracks().length > 0 || stream.getAudioTracks().length > 0)
          );
        })
        .map(([peerId, peerData]) => [
          peerId,
          {
            stream: peerData.stream,
            isSpeaking: false,
            isMuted: false,
          },
        ])
    );

    if (showLocalVideo && localStream) {
      map.set('local', {
        stream: localStream,
        isSpeaking: false,
        isMuted: false,
      });
    }

    return map;
  }, [peers, localStream, showLocalVideo]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        p: { xs: 1, sm: 2 },
        pb: { xs: '70px', sm: 2 },
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
