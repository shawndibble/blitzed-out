import { useState, useEffect, useRef } from 'react';

export default function useWindowDimensions() {
  const hasWindow = typeof window !== 'undefined';
  const resizeTimeout = useRef();

  function getWindowDimensions() {
    const width = hasWindow ? window.innerWidth : null;
    const height = hasWindow ? window.innerHeight : null;
    const isMobile = width <= 600;
    return {
      width,
      height,
      isMobile,
    };
  }

  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  function handleResize() {
    if (resizeTimeout.current) {
      clearTimeout(resizeTimeout.current);
    }
    resizeTimeout.current = setTimeout(() => {
      setWindowDimensions(getWindowDimensions());
    }, 200); // delay of 200ms
  }

  useEffect(() => {
    if (hasWindow) {
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        if (resizeTimeout.current) {
          clearTimeout(resizeTimeout.current);
        }
      };
    }
    return null;
    // eslint-disable-next-line
  }, [hasWindow]);

  return windowDimensions;
}
