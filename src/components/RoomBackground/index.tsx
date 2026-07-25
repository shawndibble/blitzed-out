import './styles.css';

import { Box } from '@mui/material';
import clsx from 'clsx';

import DirectMediaHandler, {
  DIRECT_MEDIA_VIDEO_EXTENSIONS_REGEX,
  GIF_ROUTES_TO_DIRECT_MEDIA_REGEX,
} from '@/components/DirectMediaHandler';
import { cssUrl } from '@/helpers/cssUrl';

interface RoomBackgroundProps {
  url?: string | null;
  isVideo?: boolean | null;
}

export default function RoomBackground({ url = null, isVideo = null }: RoomBackgroundProps) {
  // Direct-media routing: send to DirectMediaHandler (vs. a generic <iframe>)
  // for genuine video extensions, imported from DirectMediaHandler rather
  // than re-declared here, plus .gif (also imported) because Giphy
  // backgrounds depend on it even though DirectMediaHandler itself renders a
  // .gif as an image, not a <video> — see GIF_ROUTES_TO_DIRECT_MEDIA_REGEX's
  // comment for why dropping it breaks Giphy.
  const isDirectVideo =
    !!url &&
    (DIRECT_MEDIA_VIDEO_EXTENSIONS_REGEX.test(url) || GIF_ROUTES_TO_DIRECT_MEDIA_REGEX.test(url));

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
