import { Box, Typography, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MAX_PEERS } from '@/config/webrtc';
import useBreakpoint from '@/hooks/useBreakpoint';
import VideoTile from '../VideoTile';
import { LOCAL_PARTICIPANT_ID, type TileState } from '../tileState';

export interface ParticipantData {
  /** Whose presence record holds this participant's display name. */
  uid: string;
  stream: MediaStream | null;
  state: TileState;
  isMuted: boolean;
}

interface VideoGridProps {
  participants: Map<string, ParticipantData>;
  onRetry?: (participantId: string) => void;
}

/** The roll button is `position: fixed` over every tab, reserving no space itself. */
const ROLL_BUTTON_CLEARANCE = 80;

const VideoGrid = ({ participants, onRetry }: VideoGridProps) => {
  const { t } = useTranslation();
  const isMobile = useBreakpoint();
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
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
          }}
        >
          {t('videoCall.waitingForOthers')}
        </Typography>
      </Box>
    );
  }

  const isAtLimit = participantCount >= MAX_PEERS;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* A plain count is derivable from the tiles, so on a phone those two rows are
          worth more as video. The at-limit warning is not derivable — it names the
          cap and points elsewhere — so it survives on both. */}
      {(!isMobile || isAtLimit) && (
        <Box sx={{ mb: 2, flexShrink: 0 }}>
          <Tooltip
            title={
              isAtLimit
                ? t('videoCall.peerLimitReached', {
                    defaultValue:
                      'Maximum participant limit reached (4). For larger groups, please use Discord, Jitsi, Zoom, or Telegram.',
                  })
                : ''
            }
            arrow
            placement="top"
          >
            <Typography
              variant="body2"
              color={isAtLimit ? 'error' : 'text.secondary'}
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
            >
              {t('videoCall.participantCount', { count: participantCount })}
              {isAtLimit && ' ⚠️'}
            </Typography>
          </Tooltip>
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flexGrow: 1,
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        {Array.from(participants.entries()).map(([participantId, data]) => (
          <VideoTile
            key={participantId}
            stream={data.stream}
            participantId={participantId}
            uid={data.uid}
            state={data.state}
            isMuted={data.isMuted}
            isLocal={participantId === LOCAL_PARTICIPANT_ID}
            onRetry={onRetry ? () => onRetry(participantId) : undefined}
          />
        ))}

        {/* A spacer, not padding: padding-bottom on a scroll container is dropped
            from the scrollable overflow area by several engines when the content is
            a flex column, which is this layout. */}
        {isMobile && <Box sx={{ flexShrink: 0, height: ROLL_BUTTON_CLEARANCE }} aria-hidden />}
      </Box>
    </Box>
  );
};

export default VideoGrid;
