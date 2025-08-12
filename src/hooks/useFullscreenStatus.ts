import { useState, useEffect, useCallback } from 'react';

interface FullscreenStatusResult {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  isSupported: boolean;
}

// Extended Document interface to include vendor-prefixed properties
interface ExtendedDocument extends Document {
  webkitFullscreenElement?: Element;
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
  webkitFullscreenEnabled?: boolean;
  mozFullScreenEnabled?: boolean;
  msFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
}

// Extended Element interface to include vendor-prefixed methods
interface ExtendedElement extends Element {
  webkitRequestFullscreen?: (options?: FullscreenOptions) => Promise<void>;
  mozRequestFullScreen?: (options?: FullscreenOptions) => Promise<void>;
  msRequestFullscreen?: (options?: FullscreenOptions) => Promise<void>;
}

// Utility functions for cross-browser compatibility
const getFullscreenElement = (): Element | null => {
  const doc = document as ExtendedDocument;
  return (
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement ||
    null
  );
};

const isFullscreenSupported = (): boolean => {
  const doc = document as ExtendedDocument;
  return !!(
    doc.fullscreenEnabled ||
    doc.webkitFullscreenEnabled ||
    doc.mozFullScreenEnabled ||
    doc.msFullscreenEnabled
  );
};

const requestFullscreen = async (element: Element): Promise<void> => {
  const el = element as ExtendedElement;

  if (el.requestFullscreen) {
    return el.requestFullscreen();
  } else if (el.webkitRequestFullscreen) {
    return el.webkitRequestFullscreen();
  } else if (el.mozRequestFullScreen) {
    return el.mozRequestFullScreen();
  } else if (el.msRequestFullscreen) {
    return el.msRequestFullscreen();
  } else {
    throw new Error('Fullscreen API is not supported on this device/browser');
  }
};

const exitFullscreen = async (): Promise<void> => {
  const doc = document as ExtendedDocument;

  if (doc.exitFullscreen) {
    return doc.exitFullscreen();
  } else if (doc.webkitExitFullscreen) {
    return doc.webkitExitFullscreen();
  } else if (doc.mozCancelFullScreen) {
    return doc.mozCancelFullScreen();
  } else if (doc.msExitFullscreen) {
    return doc.msExitFullscreen();
  } else {
    throw new Error('Exit fullscreen is not supported on this device/browser');
  }
};

const getFullscreenChangeEventName = (): string => {
  if ('onfullscreenchange' in document) return 'fullscreenchange';
  if ('onwebkitfullscreenchange' in document) return 'webkitfullscreenchange';
  if ('onmozfullscreenchange' in document) return 'mozfullscreenchange';
  if ('onMSFullscreenChange' in document) return 'MSFullscreenChange';
  return 'fullscreenchange'; // fallback
};

export default function useFullscreenStatus(): FullscreenStatusResult {
  const isSupported = isFullscreenSupported();
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    // Only check if supported, otherwise return false
    return isSupported ? getFullscreenElement() != null : false;
  });

  useEffect(() => {
    // Early return if fullscreen is not supported
    if (!isSupported) {
      setIsFullscreen(false);
      return;
    }

    const handleChange = (): void => {
      setIsFullscreen(getFullscreenElement() != null);
    };

    const eventName = getFullscreenChangeEventName();
    document.addEventListener(eventName, handleChange);

    return () => {
      document.removeEventListener(eventName, handleChange);
    };
  }, [isSupported]);

  const toggleFullscreen = useCallback((): void => {
    // Early return if fullscreen is not supported
    if (!isSupported) {
      console.warn('Fullscreen API is not supported on this device/browser (likely iOS Safari)');
      return;
    }

    const currentFullscreenElement = getFullscreenElement();

    if (currentFullscreenElement == null) {
      // Enter fullscreen
      requestFullscreen(document.documentElement).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
        // Additional context for iOS Safari users
        if (navigator.userAgent.includes('Safari') && navigator.userAgent.includes('Mobile')) {
          console.warn('Note: iOS Safari does not support the Fullscreen API');
        }
      });
    } else {
      // Exit fullscreen
      exitFullscreen().catch((err) => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  }, [isSupported]);

  return {
    isFullscreen,
    toggleFullscreen,
    isSupported,
  };
}
