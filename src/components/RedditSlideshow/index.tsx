import { alpha, useTheme } from '@mui/material/styles';

import ImageSlideshow from '@/components/ImageSlideshow';
import { useRedditFeed } from '@/hooks/useRedditFeed';
import { useTranslation } from 'react-i18next';

interface RedditSlideshowProps {
  url: string;
}

export default function RedditSlideshow({ url }: RedditSlideshowProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { images, isLoading, error } = useRedditFeed(url);

  if (isLoading) {
    return (
      <div className="slideshow-container slideshow-loading" aria-hidden>
        {/* Show fallback gradient background during loading */}
        <div className="image-slideshow-fallback" />
        <div className="loading-message">{t('loadingRedditImages')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="slideshow-container slideshow-error" aria-hidden>
        {/* Show fallback gradient background on error */}
        <div className="image-slideshow-fallback" />
        <div
          className="error-message"
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            background: alpha(theme.palette.background.paper, 0.7),
            color: theme.palette.text.primary,
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            maxWidth: '300px',
            zIndex: 1000,
          }}
        >
          <strong>{t('redditBackgroundNote')}</strong>
          <br />
          {t('redditBlocked')}
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="slideshow-container slideshow-empty" aria-hidden>
        <div className="image-slideshow-fallback" />
      </div>
    );
  }

  return <ImageSlideshow images={images} />;
}
