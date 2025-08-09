import { useEffect, useState } from 'react';

import { cssUrl } from '@/helpers/cssUrl';

interface DirectMediaHandlerProps {
  url: string | null;
}

const inferMediaType = (u: string | null): 'video' | 'image' => {
  if (!u) return 'video';
  // Treat image formats as images (including GIFs)
  if (/\.(jpe?g|png|webp|bmp|svg|gif)(\?.*)?$/i.test(u)) return 'image';
  // Default to video for video extensions or unknown URLs
  return 'video';
};

function DirectMediaHandler({ url }: DirectMediaHandlerProps) {
  const [mediaType, setMediaType] = useState<'video' | 'image'>(inferMediaType(url));
  const [currentUrl, setCurrentUrl] = useState(url);

  // Reset state when URL prop changes
  useEffect(() => {
    setCurrentUrl(url);
    setMediaType(inferMediaType(url));
  }, [url]);

  if (!currentUrl) return null;

  const handleVideoError = () => {
    const failingUrl = currentUrl ?? url ?? '';
    // Special handling for Imgur URLs
    let isImgur = false;
    try {
      const parsed = new URL(failingUrl);
      isImgur = parsed.host === 'imgur.com' || parsed.host === 'i.imgur.com';
    } catch {
      // If URL parsing fails, skip Imgur-specific logic for security
      isImgur = false;
    }

    if (isImgur) {
      const imgurId = failingUrl.match(/(?:i\.)?imgur\.com\/([a-zA-Z0-9]+)(?:\.[a-z]+)?/)?.[1];
      if (imgurId) {
        const imageUrl = `https://i.imgur.com/${imgurId}.jpg`;
        setCurrentUrl(imageUrl);
        setMediaType('image');
        return;
      }
    }

    // For other URLs, try changing extension from .mp4 to common image formats
    const baseUrl = failingUrl.replace(/\.(mp4|webm|ogg|mov)(\?.*)?$/i, '');
    const imageUrl = `${baseUrl}.jpg`;
    setCurrentUrl(imageUrl);
    setMediaType('image');
  };

  const handleImageError = () => {
    const failingUrl = currentUrl ?? url ?? '';
    let isImgur = false;
    try {
      const parsed = new URL(failingUrl);
      isImgur = parsed.host === 'imgur.com' || parsed.host === 'i.imgur.com';
    } catch {
      // If URL parsing fails, skip Imgur-specific logic for security
      isImgur = false;
    }

    if (isImgur) {
      // Imgur-specific format trying
      const imgurId = failingUrl.match(/(?:i\.)?imgur\.com\/([a-zA-Z0-9]+)(?:\.[a-z]+)?/)?.[1];
      if (imgurId) {
        const formats = ['jpg', 'png', 'gif', 'jpeg', 'webp'];
        const currentFormat = currentUrl?.split('.').pop();
        const currentIndex = formats.indexOf(currentFormat || '');
        const nextIndex = currentIndex + 1;

        if (nextIndex < formats.length) {
          const nextFormat = formats[nextIndex];
          const nextUrl = `https://i.imgur.com/${imgurId}.${nextFormat}`;
          setCurrentUrl(nextUrl);
        }
      }
    } else {
      // For other URLs, try different image extensions
      const formats = ['jpg', 'png', 'gif', 'jpeg', 'webp'];
      const currentFormat = currentUrl?.split('.').pop();
      const currentIndex = formats.indexOf(currentFormat || '');
      const nextIndex = currentIndex + 1;

      if (nextIndex < formats.length && currentUrl) {
        const nextFormat = formats[nextIndex];
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
        // Cast-specific optimizations
        preload="auto"
        crossOrigin="anonymous"
        controls={true}
      />
    );
  }

  // Render as background image - use hidden img for error handling
  return (
    <>
      <div
        className="image-background"
        style={{
          backgroundImage: currentUrl ? cssUrl(currentUrl) : undefined,
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

export default DirectMediaHandler;
