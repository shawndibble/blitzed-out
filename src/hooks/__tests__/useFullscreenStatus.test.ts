import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import useFullscreenStatus from '../useFullscreenStatus';

// Mock document properties and methods
const mockDocument = document as any;

describe('useFullscreenStatus', () => {
  beforeEach(() => {
    // Reset all document properties
    delete mockDocument.fullscreenElement;
    delete mockDocument.webkitFullscreenElement;
    delete mockDocument.mozFullScreenElement;
    delete mockDocument.msFullscreenElement;
    delete mockDocument.fullscreenEnabled;
    delete mockDocument.webkitFullscreenEnabled;
    delete mockDocument.mozFullScreenEnabled;
    delete mockDocument.msFullscreenEnabled;

    // Mock requestFullscreen methods
    mockDocument.documentElement.requestFullscreen = vi.fn(() => Promise.resolve());
    mockDocument.documentElement.webkitRequestFullscreen = vi.fn(() => Promise.resolve());
    mockDocument.documentElement.mozRequestFullScreen = vi.fn(() => Promise.resolve());
    mockDocument.documentElement.msRequestFullscreen = vi.fn(() => Promise.resolve());

    // Mock exitFullscreen methods
    mockDocument.exitFullscreen = vi.fn(() => Promise.resolve());
    mockDocument.webkitExitFullscreen = vi.fn(() => Promise.resolve());
    mockDocument.mozCancelFullScreen = vi.fn(() => Promise.resolve());
    mockDocument.msExitFullscreen = vi.fn(() => Promise.resolve());

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Modern browsers with standard API', () => {
    beforeEach(() => {
      mockDocument.fullscreenEnabled = true;
      mockDocument.fullscreenElement = null;
    });

    it('should return correct initial state when fullscreen is supported', () => {
      const { result } = renderHook(() => useFullscreenStatus());

      expect(result.current.isSupported).toBe(true);
      expect(result.current.isFullscreen).toBe(false);
      expect(typeof result.current.toggleFullscreen).toBe('function');
    });

    it('should detect fullscreen state when element is in fullscreen', () => {
      mockDocument.fullscreenElement = mockDocument.documentElement;

      const { result } = renderHook(() => useFullscreenStatus());

      expect(result.current.isFullscreen).toBe(true);
    });

    it('should call standard requestFullscreen when entering fullscreen', async () => {
      const { result } = renderHook(() => useFullscreenStatus());

      await act(async () => {
        result.current.toggleFullscreen();
      });

      expect(mockDocument.documentElement.requestFullscreen).toHaveBeenCalled();
    });

    it('should call standard exitFullscreen when exiting fullscreen', async () => {
      mockDocument.fullscreenElement = mockDocument.documentElement;

      const { result } = renderHook(() => useFullscreenStatus());

      await act(async () => {
        result.current.toggleFullscreen();
      });

      expect(mockDocument.exitFullscreen).toHaveBeenCalled();
    });
  });

  describe('WebKit browsers (Safari)', () => {
    beforeEach(() => {
      // Clear standard properties
      delete mockDocument.fullscreenEnabled;
      delete mockDocument.fullscreenElement;
      delete (mockDocument.documentElement as any).requestFullscreen;
      delete (mockDocument as any).exitFullscreen;
      // Set webkit properties
      mockDocument.webkitFullscreenEnabled = true;
      mockDocument.webkitFullscreenElement = null;
    });

    it('should detect webkit support', () => {
      const { result } = renderHook(() => useFullscreenStatus());

      expect(result.current.isSupported).toBe(true);
    });

    it('should use webkit prefixed methods', async () => {
      const { result } = renderHook(() => useFullscreenStatus());

      await act(async () => {
        result.current.toggleFullscreen();
      });

      expect(mockDocument.documentElement.webkitRequestFullscreen).toHaveBeenCalled();
    });

    it('should detect webkit fullscreen element', () => {
      mockDocument.webkitFullscreenElement = mockDocument.documentElement;

      const { result } = renderHook(() => useFullscreenStatus());

      expect(result.current.isFullscreen).toBe(true);
    });

    it('should call webkit exit fullscreen', async () => {
      mockDocument.webkitFullscreenElement = mockDocument.documentElement;

      const { result } = renderHook(() => useFullscreenStatus());

      await act(async () => {
        result.current.toggleFullscreen();
      });

      expect(mockDocument.webkitExitFullscreen).toHaveBeenCalled();
    });
  });

  describe('Mozilla browsers (Firefox)', () => {
    beforeEach(() => {
      // Clear standard and webkit properties
      delete mockDocument.fullscreenEnabled;
      delete mockDocument.fullscreenElement;
      delete mockDocument.webkitFullscreenEnabled;
      delete mockDocument.webkitFullscreenElement;
      delete (mockDocument.documentElement as any).requestFullscreen;
      delete (mockDocument.documentElement as any).webkitRequestFullscreen;
      delete (mockDocument as any).exitFullscreen;
      delete (mockDocument as any).webkitExitFullscreen;
      // Set moz properties
      mockDocument.mozFullScreenEnabled = true;
      mockDocument.mozFullScreenElement = null;
    });

    it('should use mozilla prefixed methods', async () => {
      const { result } = renderHook(() => useFullscreenStatus());

      await act(async () => {
        result.current.toggleFullscreen();
      });

      expect(mockDocument.documentElement.mozRequestFullScreen).toHaveBeenCalled();
    });
  });

  describe('Microsoft browsers (IE/Edge)', () => {
    beforeEach(() => {
      // Clear standard, webkit, and moz properties
      delete mockDocument.fullscreenEnabled;
      delete mockDocument.fullscreenElement;
      delete mockDocument.webkitFullscreenEnabled;
      delete mockDocument.webkitFullscreenElement;
      delete mockDocument.mozFullScreenEnabled;
      delete mockDocument.mozFullScreenElement;
      delete (mockDocument.documentElement as any).requestFullscreen;
      delete (mockDocument.documentElement as any).webkitRequestFullscreen;
      delete (mockDocument.documentElement as any).mozRequestFullScreen;
      delete (mockDocument as any).exitFullscreen;
      delete (mockDocument as any).webkitExitFullscreen;
      delete (mockDocument as any).mozCancelFullScreen;
      // Set ms properties
      mockDocument.msFullscreenEnabled = true;
      mockDocument.msFullscreenElement = null;
    });

    it('should use microsoft prefixed methods', async () => {
      const { result } = renderHook(() => useFullscreenStatus());

      await act(async () => {
        result.current.toggleFullscreen();
      });

      expect(mockDocument.documentElement.msRequestFullscreen).toHaveBeenCalled();
    });
  });

  describe('Unsupported browsers (iOS Safari)', () => {
    beforeEach(() => {
      // No fullscreen support properties
      Object.defineProperty(navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
        configurable: true,
      });
    });

    it('should detect lack of support', () => {
      const { result } = renderHook(() => useFullscreenStatus());

      expect(result.current.isSupported).toBe(false);
      expect(result.current.isFullscreen).toBe(false);
    });

    it('should not throw when trying to toggle fullscreen', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useFullscreenStatus());

      expect(() => {
        act(() => {
          result.current.toggleFullscreen();
        });
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Fullscreen API is not supported on this device/browser (likely iOS Safari)'
      );

      consoleSpy.mockRestore();
    });

    it('should not call any fullscreen methods on unsupported browsers', async () => {
      const { result } = renderHook(() => useFullscreenStatus());

      await act(async () => {
        result.current.toggleFullscreen();
      });

      expect(mockDocument.documentElement.requestFullscreen).not.toHaveBeenCalled();
      expect(mockDocument.documentElement.webkitRequestFullscreen).not.toHaveBeenCalled();
      expect(mockDocument.documentElement.mozRequestFullScreen).not.toHaveBeenCalled();
      expect(mockDocument.documentElement.msRequestFullscreen).not.toHaveBeenCalled();
    });
  });

  describe('Event handling', () => {
    beforeEach(() => {
      mockDocument.fullscreenEnabled = true;
      mockDocument.fullscreenElement = null;
    });

    it('should register fullscreen change event listener', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      renderHook(() => useFullscreenStatus());

      expect(addEventListenerSpy).toHaveBeenCalledWith('fullscreenchange', expect.any(Function));
    });

    it('should clean up event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = renderHook(() => useFullscreenStatus());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('fullscreenchange', expect.any(Function));
    });

    it('should use webkit event name when standard is not available', () => {
      delete (document as any).onfullscreenchange;
      (document as any).onwebkitfullscreenchange = null;

      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      renderHook(() => useFullscreenStatus());

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'webkitfullscreenchange',
        expect.any(Function)
      );
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      mockDocument.fullscreenEnabled = true;
      mockDocument.fullscreenElement = null;
    });

    it('should handle requestFullscreen errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Fullscreen not allowed');
      mockDocument.documentElement.requestFullscreen = vi.fn(() => Promise.reject(error));

      const { result } = renderHook(() => useFullscreenStatus());

      await act(async () => {
        result.current.toggleFullscreen();
        // Wait for the promise to reject
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error attempting to enable fullscreen:', error);

      consoleSpy.mockRestore();
    });

    it('should handle exitFullscreen errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Exit fullscreen failed');
      mockDocument.fullscreenElement = mockDocument.documentElement;
      mockDocument.exitFullscreen = vi.fn(() => Promise.reject(error));

      const { result } = renderHook(() => useFullscreenStatus());

      await act(async () => {
        result.current.toggleFullscreen();
        // Wait for the promise to reject
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error attempting to exit fullscreen:', error);

      consoleSpy.mockRestore();
    });
  });
});
