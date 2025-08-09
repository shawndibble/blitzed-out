import './styles.css';

import { useEffect, useRef, useState } from 'react';

import clsx from 'clsx';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageKey, setImageKey] = useState(0);

  const intervalRef = useRef<number | null>(null);

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

    // Start cycling after brief delay
    const initialDelay = window.setTimeout(startSlideshow, 1000);

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

  if (images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  return (
    <div className={clsx('image-slideshow-container', className)} aria-hidden>
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
    </div>
  );
}
