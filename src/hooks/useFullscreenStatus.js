import { useState, useEffect } from 'react';

export default function useFullscreenStatus() {
  const [isFullscreen, setIsFullscreen] = useState(document.fullscreenElement != null);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(document.fullscreenElement != null);
    };

    document.addEventListener('fullscreenchange', handleChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
    };
  }, []);

  const setFullScreen = () => document.requestFullscreen();

  return { isFullscreen, setFullScreen };
}