import { useMemo } from 'react';
import { Box } from '@mui/material';
import { MAX_RETRY_ATTEMPTS, useVideoCallStore } from '@/stores/videoCallStore';
import useBreakpoint from '@/hooks/useBreakpoint';
import { deriveLocalMedia, type MediaState } from '@/types/videoCall';
import { LOCAL_PARTICIPANT_ID, resolveTileState } from './tileState';
import VideoGrid, { type ParticipantData } from './VideoGrid';
import VideoControls from './VideoControls';

interface VideoCallPanelProps {
  roomId?: string;
  showLocalVideo?: boolean;
  onEndCall?: () => void;
}

const VideoCallPanel = ({ roomId, showLocalVideo = false, onEndCall }: VideoCallPanelProps) => {
  const isMobile = useBreakpoint();

  const peers = useVideoCallStore((state) => state.peers);
  const roster = useVideoCallStore((state) => state.roster);
  const mediaStates = useVideoCallStore((state) => state.mediaStates);
  const peerRetries = useVideoCallStore((state) => state.peerRetries);
  const localStream = useVideoCallStore((state) => state.localStream);
  const userId = useVideoCallStore((state) => state.userId);
  const isMuted = useVideoCallStore((state) => state.isMuted);
  const isVideoOff = useVideoCallStore((state) => state.isVideoOff);
  const hasCamera = useVideoCallStore((state) => state.hasCamera);
  const isPageHidden = useVideoCallStore((state) => state.isPageHidden);
  const retryPeer = useVideoCallStore((state) => state.retryPeer);

  const remoteParticipants = useMemo(() => {
    const entries: Array<[string, ParticipantData]> = [];

    // The union of both, not either alone. Someone who has joined but has not been
    // dialled holds no peer connection; and a live peer whose heartbeat has gone
    // stale drops out of the roster, which is what a backgrounded tab does.
    for (const participantId of new Set([...roster, ...peers.keys()])) {
      if (participantId === userId) continue;

      const peerData = peers.get(participantId);
      const media: MediaState = mediaStates.get(participantId) ?? {};
      const attempts = peerRetries.get(participantId)?.attempts ?? 0;

      entries.push([
        participantId,
        {
          uid: participantId,
          stream: peerData?.stream ?? null,
          isMuted: media.mic === 'off',
          state: resolveTileState({
            hasVideoTrack: (peerData?.stream?.getVideoTracks().length ?? 0) > 0,
            media,
            connectionState: peerData?.connectionState,
            reconnecting: peerData?.reconnecting,
            awaitingRetry: !peerData && attempts > 0,
            retriesExhausted: attempts >= MAX_RETRY_ATTEMPTS,
          }),
        },
      ]);
    }

    return entries;
  }, [peers, roster, mediaStates, peerRetries, userId]);

  // Kept apart from the remote list so muting yourself does not re-resolve everyone
  // else's tile. Read from local state rather than waiting for our own roster write
  // to echo back, so tapping the camera button is reflected immediately.
  const localParticipant = useMemo((): ParticipantData | null => {
    if (!showLocalVideo || !localStream) return null;

    const media = deriveLocalMedia({ hasCamera, isVideoOff, isPageHidden, isMuted });

    return {
      uid: userId ?? LOCAL_PARTICIPANT_ID,
      stream: localStream,
      isMuted,
      state: resolveTileState({
        hasVideoTrack: localStream.getVideoTracks().length > 0,
        media,
        isLocal: true,
      }),
    };
  }, [showLocalVideo, localStream, hasCamera, isVideoOff, isPageHidden, isMuted, userId]);

  const participants = useMemo(() => {
    const entries = [...remoteParticipants];
    if (localParticipant) entries.push([LOCAL_PARTICIPANT_ID, localParticipant]);
    return new Map(entries);
  }, [remoteParticipants, localParticipant]);

  return (
    <Box
      sx={{
        display: 'flex',
        // On mobile the controls sit directly under the top nav so the tiles can take
        // every remaining pixel; the roll button already owns the bottom thumb zone.
        flexDirection: isMobile ? 'column-reverse' : 'column',
        justifyContent: 'flex-end',
        height: '100%',
        p: { xs: 1, sm: 2 },
      }}
    >
      <Box sx={{ flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>
        <VideoGrid participants={participants} onRetry={retryPeer} />
      </Box>
      <VideoControls roomId={roomId} onEndCall={onEndCall} />
    </Box>
  );
};

export default VideoCallPanel;
