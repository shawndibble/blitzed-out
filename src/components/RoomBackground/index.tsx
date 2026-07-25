import './styles.css';

import { Box } from '@mui/material';
import clsx from 'clsx';

import DirectMediaHandler from '@/components/DirectMediaHandler';
import { cssUrl } from '@/helpers/cssUrl';

interface RoomBackgroundProps {
  url?: string | null;
  isVideo?: boolean | null;
}

export default function RoomBackground({ url = null, isVideo = null }: RoomBackgroundProps) {
  // Check if the URL is a direct video file (MP4, WebM, etc.)
  const isDirectVideo = url && /\.(mp4|webm|ogg|mov|gif)(\?.*)?$/i.test(url);

  // Show default background when no custom background is set OR when background is "color" or "gray".
  // Both entry points (getBackgroundSource, getPrivateRoomBackground) short-circuit these two
  // sentinels to exact literal values before any URL processing, so an exact match is sufficient —
  // a substring match here would misclassify real URLs whose text merely contains "color"/"gray".
  const isNonImageBackground = url === 'color' || url === 'gray';
  const hasCustomBackground = url && !isNonImageBackground && (isVideo || (!isVideo && url));

  return (
    <Box
      className={clsx('main-container', !hasCustomBackground && 'default-background')}
      role="presentation"
      sx={{
        backgroundImage: !isVideo && url && !isNonImageBackground ? cssUrl(url) : 'none',
      }}
    >
      {isVideo &&
        // Use DirectMediaHandler only for direct video files (e.g., mp4, webm, etc.)
        (isDirectVideo ? (
          <DirectMediaHandler url={url} />
        ) : (
          <iframe
            src={url || undefined}
            title="video"
            width="100%"
            height="100%"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            sandbox="allow-same-origin allow-scripts allow-presentation"
            style={{ border: 'none' }}
          />
        ))}
    </Box>
  );
}
