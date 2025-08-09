import { useTranslation } from 'react-i18next';

import ImageSlideshow from '@/components/ImageSlideshow';
import { useRedditFeed } from '@/hooks/useRedditFeed';

interface RedditSlideshowProps {
  url: string;
}

export default function RedditSlideshow({ url }: RedditSlideshowProps) {
  const { t } = useTranslation();
  const { images, isLoading, error } = useRedditFeed(url);

  if (isLoading) {
    return (
      <div className="slideshow-container slideshow-loading" aria-hidden>
        <div className="loading-message">{t('loadingRedditImages')}</div>
      </div>
    );
  }

  if (error || images.length === 0) {
    // Show an informative error message for Reddit issues
    if (error) {
      return (
        <div className="slideshow-container slideshow-error" aria-hidden>
          <div
            className="error-message"
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
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
    return null;
  }

  return <ImageSlideshow images={images} />;
}
