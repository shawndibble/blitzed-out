import { Box } from '@mui/material';
import clsx from 'clsx';
import './styles.css';

interface RoomBackgroundProps {
  url?: string | null;
  isVideo?: boolean | null;
}

// Enum for background types
enum BackgroundType {
  COLOR = '/images/color',
  GRAY = '/images/gray',
}

export default function RoomBackground({ url = null, isVideo = null }: RoomBackgroundProps) {
  // Check if the URL is a direct video file (MP4, WebM, etc.)
  const isDirectVideo = url && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);

  // Show default background when no custom background is set OR when background is "color" or "gray"
  const isNonImageBackground =
    url && (url.includes(BackgroundType.COLOR) || url.includes(BackgroundType.GRAY));
  const hasCustomBackground = url && !isNonImageBackground && (isVideo || (!isVideo && url));

  return (
    <Box
      className={clsx('main-container', !hasCustomBackground && 'default-background')}
      role="presentation"
      sx={{
        backgroundImage: !isVideo && url && !isNonImageBackground ? `url(${url})` : 'none',
      }}
    >
      {isVideo &&
        (isDirectVideo ? (
          <video
            autoPlay={true}
            loop={true}
            muted={true}
            playsInline={true}
            src={url || undefined}
            className="video-background"
          />
        ) : (
          <iframe
            width="100%"
            height="100%"
            src={url || undefined}
            title="video"
            allowFullScreen
            allow="autoplay"
            style={{ border: 0 }}
          />
        ))}
    </Box>
  );
}
