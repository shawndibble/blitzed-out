import './styles.css';

import { useEffect, useRef, useState } from 'react';

import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

interface ImageSlideshowProps {
  images: string[];
  className?: string;
  zoomDuration?: number; // Duration in milliseconds
  zoomScale?: number; // Scale factor (e.g., 1.4 = 140%)
}

export default function ImageSlideshow({
  images,
  className,
  zoomDuration = 3000,
  zoomScale = 1.4,
}: ImageSlideshowProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageKey, setImageKey] = useState(0);
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
  const [hasLoadedFirstImage, setHasLoadedFirstImage] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const preloadRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Reset loading state when images change
  useEffect(() => {
    setHasLoadedFirstImage(false);
    setPreloadedImages(new Set());
    setImageLoadErrors(new Set());
    preloadRef.current.clear();
    setCurrentIndex(0);
    setImageKey(0);
  }, [images]);

  // Preload images for smooth transitions
  useEffect(() => {
    if (images.length === 0) return;

    const preloadImage = (src: string): Promise<void> => {
      return new Promise((resolve) => {
        // Skip if already preloaded or failed
        if (preloadRef.current.has(src) || imageLoadErrors.has(src)) {
          resolve();
          return;
        }

        const img = new Image();
        img.onload = () => {
          preloadRef.current.set(src, img);
          setPreloadedImages((prev) => {
            const newSet = new Set(prev).add(src);
            // Mark first image as loaded if this is the first image we've loaded
            if (!hasLoadedFirstImage && src === images[0]) {
              setHasLoadedFirstImage(true);
            }
            return newSet;
          });
          resolve();
        };
        img.onerror = () => {
          setImageLoadErrors((prev) => new Set(prev).add(src));
          resolve();
        };
        img.src = src;
      });
    };

    // Preload current and next few images
    const preloadNext = async () => {
      const preloadCount = Math.min(5, images.length); // Preload next 5 images
      const preloadPromises: Promise<void>[] = [];

      for (let i = 0; i < preloadCount; i++) {
        const index = (currentIndex + i) % images.length;
        preloadPromises.push(preloadImage(images[index]));
      }

      await Promise.all(preloadPromises);
    };

    preloadNext();
  }, [images, currentIndex, imageLoadErrors, hasLoadedFirstImage]);

  // Start slideshow when images are available
  useEffect(() => {
    if (images.length === 0) return;
    if (images.length === 1) return; // No cycling needed for single image

    const startSlideshow = () => {
      intervalRef.current = window.setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
        setImageKey((prev) => prev + 1);
      }, zoomDuration);
    };

    // Start cycling after brief delay to allow for initial preloading
    const initialDelay = window.setTimeout(startSlideshow, 2000);

    return () => {
      window.clearTimeout(initialDelay);
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [images.length, zoomDuration]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const currentImage = images[currentIndex] || '';
  const isCurrentImagePreloaded =
    preloadedImages.has(currentImage) || preloadRef.current.has(currentImage);
  const hasCurrentImageError = imageLoadErrors.has(currentImage);

  // Skip to next image if current image failed to load
  useEffect(() => {
    if (hasCurrentImageError && images.length > 1) {
      const nextIndex = (currentIndex + 1) % images.length;
      setCurrentIndex(nextIndex);
      setImageKey((prev) => prev + 1);
    }
  }, [hasCurrentImageError, currentIndex, images.length]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className={clsx('image-slideshow-container', className)} aria-hidden>
      {/* Fallback background during loading */}
      <div className="image-slideshow-fallback" />

      {/* Show loading message while waiting for first image */}
      {!hasLoadedFirstImage && images.length > 0 && (
        <div className="loading-message">{t('loadingImages')}</div>
      )}

      {/* Only show image if it's preloaded and not errored */}
      {isCurrentImagePreloaded && !hasCurrentImageError && (
        <div
          key={imageKey}
          className="image-slideshow-slide"
          style={
            {
              backgroundImage: `url(${currentImage})`,
              animationDuration: `${zoomDuration}ms`,
              '--zoom-scale': zoomScale,
            } as React.CSSProperties & { '--zoom-scale': number }
          }
        />
      )}
    </div>
  );
}
