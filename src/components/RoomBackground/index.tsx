import './styles.css';

import { useMemo } from 'react';

import { Box } from '@mui/material';
import clsx from 'clsx';

import DirectMediaHandler from '@/components/DirectMediaHandler';
import ImageSlideshow from '@/components/ImageSlideshow';
import { useImageFeed } from '@/hooks/useImageFeed';
import { type ImageFeedConfig, detectFeedType } from '@/services/imageFeedService';

interface RoomBackgroundProps {
  url?: string | null;
  isVideo?: boolean | null;
}

// Create a slideshow component for image feeds (Reddit, Tumblr, etc.)
function ImageFeedSlideshow({ url }: { url: string }) {
  const feedConfig = useMemo<ImageFeedConfig | null>(() => {
    const feedType = detectFeedType(url);
    if (!feedType) return null;

    return {
      type: feedType,
      url: url,
      maxImages: 150,
    };
  }, [url]);

  const { images, isLoading, error } = useImageFeed(feedConfig);

  if (isLoading) {
    return (
      <div className="slideshow-container slideshow-loading" aria-hidden>
        <div className="loading-message">Loading images...</div>
      </div>
    );
  }

  if (error || images.length === 0) {
    return null;
  }

  return <ImageSlideshow images={images} />;
}

export default function RoomBackground({ url = null, isVideo = null }: RoomBackgroundProps) {
  // Check if the URL is a direct video file (MP4, WebM, etc.)
  const isDirectVideo = url && /\.(mp4|webm|ogg|mov|gif)(\?.*)?$/i.test(url);

  // Check if URL is an image feed (Reddit, Tumblr, etc.)
  const feedType = url ? detectFeedType(url) : null;
  const isImageFeed = !!feedType;

  // Show default background when no custom background is set OR when background is "color" or "gray"
  const isNonImageBackground =
    url === 'color' || url === 'gray' || url?.includes('/color') || url?.includes('/gray');
  const hasCustomBackground = url && !isNonImageBackground && (isVideo || (!isVideo && url));

  return (
    <Box
      className={clsx('main-container', !hasCustomBackground && 'default-background')}
      role="presentation"
      sx={{
        backgroundImage:
          !isVideo && url && !isNonImageBackground && !isImageFeed ? `url(${url})` : 'none',
      }}
    >
      {isVideo &&
        !isImageFeed &&
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

      {/* Image feed slideshow if a supported URL is provided */}
      {!isVideo && isImageFeed && url ? <ImageFeedSlideshow url={url} /> : null}
    </Box>
  );
}
