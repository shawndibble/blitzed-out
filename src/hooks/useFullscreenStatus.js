import { useState, useEffect, useCallback } from 'react';

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
  const toggleFullscreen = useCallback((): void => {
    if (document.fullscreenElement == null) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  }, []);

  return { isFullscreen, toggleFullscreen };
}
