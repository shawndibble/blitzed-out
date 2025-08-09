import './styles.css';

import { Box } from '@mui/material';
import clsx from 'clsx';

import DirectMediaHandler from '@/components/DirectMediaHandler';
import RedditSlideshow from '@/components/RedditSlideshow';
import { isRedditUrl } from '@/services/redditService';

interface RoomBackgroundProps {
  url?: string | null;
  isVideo?: boolean | null;
}

export default function RoomBackground({ url = null, isVideo = null }: RoomBackgroundProps) {
  // Check if the URL is a direct video file (MP4, WebM, etc.)
  const isDirectVideo = url && /\.(mp4|webm|ogg|mov|gif)(\?.*)?$/i.test(url);

  // Check if URL is a Reddit URL
  const isReddit = url ? isRedditUrl(url) : false;

  // Show default background when no custom background is set OR when background is "color" or "gray"
  const isNonImageBackground =
    url === 'color' || url === 'gray' || url?.includes('/color') || url?.includes('/gray');
  const hasCustomBackground = url && !isNonImageBackground && (isVideo || (!isVideo && url));

  // Special handling for different content types
  const shouldShowRedditSlideshow = !isVideo && isReddit && url;

  return (
    <Box
      className={clsx('main-container', !hasCustomBackground && 'default-background')}
      role="presentation"
      sx={{
        backgroundImage:
          !isVideo && url && !isNonImageBackground && !isReddit ? `url(${url})` : 'none',
      }}
    >
      {isVideo &&
        !isReddit &&
        // Use DirectMediaHandler only for direct video files (e.g., mp4, webm, etc.)
        (isDirectVideo ? (
          <DirectMediaHandler url={url} />
        ) : (
          <iframe
            width="100%"
            height="100%"
            src={url || undefined}
            title="video"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            sandbox="allow-same-origin allow-scripts allow-presentation"
            style={{
              border: 0,
            }}
          />
        ))}

      {/* Reddit slideshow if a Reddit URL is provided */}
      {shouldShowRedditSlideshow ? <RedditSlideshow url={url} /> : null}
    </Box>
  );
}
