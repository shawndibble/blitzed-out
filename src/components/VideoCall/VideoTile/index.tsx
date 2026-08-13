import { useCallback, useEffect, useRef } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { MicOff, VideocamOff, WifiTetheringOff } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import TextAvatar from '@/components/TextAvatar';
import { useUser } from '@/stores/userListStore';
import { showsVideo, tileStateLabelKey, type TileState } from '../tileState';

interface VideoTileProps {
  stream?: MediaStream | null;
  participantId: string;
  /** Whose presence record holds the display name — our own tile is not keyed by it. */
  uid: string;
  state: TileState;
  isMuted?: boolean;
  isLocal?: boolean;
  onRetry?: () => void;
}

const COLLAPSED_AVATAR = 40;
/** The avatar plus breathing room — the whole point is that it beats a full tile. */
const COLLAPSED_HEIGHT = 56;

function StateIcon({ state }: { state: TileState }) {
  if (state === 'connecting' || state === 'reconnecting') {
    return <CircularProgress size={18} color={state === 'reconnecting' ? 'warning' : 'inherit'} />;
  }
  if (state === 'failed') {
    return <WifiTetheringOff fontSize="small" sx={{ color: 'error.main' }} />;
  }
  if (state === 'muted') {
    return <MicOff fontSize="small" sx={{ color: 'text.secondary' }} />;
  }
  return <VideocamOff fontSize="small" sx={{ color: 'text.secondary' }} />;
}

/**
 * One participant, as either a video tile or a collapsed row.
 *
 * Both forms are one element at two heights, and the `<video>` stays mounted while
 * collapsed. Moving a participant between components would change their position in
 * the React tree, and React discards state on a position change — destroying the
 * `<video>` and its `srcObject`, so every camera-on would open on a black frame.
 */
const VideoTile = ({
  stream,
  participantId,
  uid,
  state,
  isMuted = false,
  isLocal = false,
  onRetry,
}: VideoTileProps) => {
  const { t } = useTranslation();
  // Read per tile rather than handing the panel the whole presence map: that map's
  // identity changes on every user's heartbeat app-wide, which would re-render the
  // entire grid at global presence rate.
  const displayName = useUser(uid)?.displayName;
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * Crop a landscape frame to fill the tile, but never cut a portrait sender in half
   * — letterboxing is the lesser harm when the shapes disagree. Written to the
   * element rather than held in state: it changes once per stream, and a render for
   * it would buy nothing.
   *
   * Read off the element, not `track.getSettings()`: remote receiver tracks start
   * with no width or height, and Firefox returns an empty object for non-getUserMedia
   * tracks.
   */
  const readOrientation = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement?.videoWidth || !videoElement.videoHeight) return;
    videoElement.style.objectFit =
      videoElement.videoHeight > videoElement.videoWidth ? 'contain' : 'cover';
  }, []);

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
        // A new sender's shape is unknown until its first frame decodes.
        videoElement.style.objectFit = 'cover';
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

  const showVideo = showsVideo(state);
  const labelKey = tileStateLabelKey(state);
  const name = displayName?.trim() || t('videoCall.participant', { defaultValue: 'Participant' });

  return (
    <Box
      data-testid={`video-tile-${participantId}`}
      data-state={state}
      sx={{
        position: 'relative',
        width: '100%',
        flexShrink: 0,
        // Fixed geometry, whatever the sender's camera produces. Sizing the box to
        // the track instead would reflow the whole column every time simulcast drops
        // a layer, which is far more disruptive than a letterboxed portrait tile.
        ...(showVideo ? { aspectRatio: '16 / 9' } : { height: COLLAPSED_HEIGHT }),
        borderRadius: 1,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: showVideo ? 0 : 1.5,
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        onLoadedMetadata={readOrientation}
        onResize={readOrientation}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: showVideo ? 'block' : 'none',
        }}
      />

      {showVideo ? (
        isMuted && (
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
        )
      ) : (
        <>
          <TextAvatar uid={uid} displayName={name} size={COLLAPSED_AVATAR} />

          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="body2" noWrap>
              {name}
            </Typography>
            {labelKey && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {t(labelKey)}
              </Typography>
            )}
          </Box>

          <StateIcon state={state} />

          {state === 'failed' && onRetry && (
            <Button size="small" onClick={onRetry}>
              {t('videoCall.retry')}
            </Button>
          )}
        </>
      )}
    </Box>
  );
};

export default VideoTile;
