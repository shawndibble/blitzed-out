import {
  useState, useRef, useCallback, useLayoutEffect,
} from 'react';

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

  const handleResize = useCallback(() => {
    if (resizeTimeout.current) {
      clearTimeout(resizeTimeout.current);
    }
    resizeTimeout.current = setTimeout(() => {
      setWindowDimensions(getWindowDimensions());
    }, 200); // delay of 200ms
  });

  useLayoutEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current);
      }
    };
  }, []);

  return windowDimensions;
}
