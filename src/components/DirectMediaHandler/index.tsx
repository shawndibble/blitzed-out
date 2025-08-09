import { useEffect, useState } from 'react';

interface DirectMediaHandlerProps {
  url: string | null;
}

function DirectMediaHandler({ url }: DirectMediaHandlerProps) {
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

export default DirectMediaHandler;
