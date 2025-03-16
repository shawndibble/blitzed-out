import { useState, useEffect } from 'react';

export default function useFullscreenStatus(): { 
  isFullscreen: boolean; 
  toggleFullscreen: () => void 
} {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(document.fullscreenElement != null);

  useEffect(() => {
    const handleChange = (): void => {
      setIsFullscreen(document.fullscreenElement != null);
    };

    document.addEventListener('fullscreenchange', handleChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
    };
  }, []);

  // open fullscreen
  const toggleFullscreen = (): void => {
    if (document.fullscreenElement == null) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return { isFullscreen, toggleFullscreen };
}
