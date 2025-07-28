import { Box } from '@mui/material';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
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

// Component to handle direct media URLs with video/image fallback
function DirectMediaHandler({ url }: { url: string | null }) {
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');
  const [currentUrl, setCurrentUrl] = useState(url);

  // Reset state when URL prop changes
  useEffect(() => {
    setCurrentUrl(url);
    setMediaType('video');
  }, [url]);

  if (!url) return null;

  const handleVideoError = () => {
    // Special handling for Imgur URLs
    let isImgur = false;
    try {
      const parsed = new URL(url);
      isImgur = parsed.host === 'imgur.com' || parsed.host === 'i.imgur.com';
    } catch {
      // If URL parsing fails, skip Imgur-specific logic for security
      isImgur = false;
    }

    if (isImgur) {
      const imgurId = url.match(/imgur\.com\/([a-zA-Z0-9]+)/)?.[1];
      if (imgurId) {
        const imageUrl = `https://i.imgur.com/${imgurId}.jpg`;
        setCurrentUrl(imageUrl);
        setMediaType('image');
        return;
      }
    }

    // For other URLs, try changing extension from .mp4 to common image formats
    const baseUrl = url.replace(/\.(mp4|webm|ogg|mov)(\?.*)?$/i, '');
    const imageUrl = `${baseUrl}.jpg`;
    setCurrentUrl(imageUrl);
    setMediaType('image');
  };

  const handleImageError = () => {
    let isImgur = false;
    try {
      const parsed = new URL(url);
      isImgur = parsed.host === 'imgur.com' || parsed.host === 'i.imgur.com';
    } catch {
      // If URL parsing fails, skip Imgur-specific logic for security
      isImgur = false;
    }

    if (isImgur) {
      // Imgur-specific format trying
      const imgurId = url.match(/imgur\.com\/([a-zA-Z0-9]+)/)?.[1];
      if (imgurId) {
        const formats = ['png', 'gif', 'jpeg', 'webp'];
        const currentFormat = currentUrl?.split('.').pop();
        const nextFormat = formats.find((f) => f !== currentFormat);

        if (nextFormat) {
          const nextUrl = `https://i.imgur.com/${imgurId}.${nextFormat}`;
          setCurrentUrl(nextUrl);
        }
      }
    } else {
      // For other URLs, try different image extensions
      const formats = ['png', 'gif', 'jpeg', 'webp'];
      const currentFormat = currentUrl?.split('.').pop();
      const nextFormat = formats.find((f) => f !== currentFormat);

      if (nextFormat && currentUrl) {
        const baseUrl = currentUrl.replace(/\.[^.]+(\?.*)?$/, '');
        const nextUrl = `${baseUrl}.${nextFormat}`;
        setCurrentUrl(nextUrl);
      }
    }
  };

  if (mediaType === 'video') {
    return (
      <video
        autoPlay={true}
        loop={true}
        muted={true}
        playsInline={true}
        src={currentUrl || undefined}
        className="video-background"
        onError={handleVideoError}
      />
    );
  }

  // Render as background image - use hidden img for error handling
  return (
    <>
      <div
        className="image-background"
        style={{
          backgroundImage: `url(${currentUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
      <img
        src={currentUrl || undefined}
        onError={handleImageError}
        style={{ display: 'none' }}
        alt=""
      />
    </>
  );
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
          <DirectMediaHandler url={url} />
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
