import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isHapticSupported, vibrate } from '../haptics';

describe('haptics', () => {
  let originalNavigator: Navigator;

  beforeEach(() => {
    originalNavigator = global.navigator;
    vi.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
    vi.useRealTimers();
  });

  describe('isHapticSupported', () => {
    it('returns true when navigator.vibrate exists', () => {
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: vi.fn(), userAgent: '' },
        writable: true,
      });
      expect(isHapticSupported()).toBe(true);
    });

    it('returns true for iOS devices', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)' },
        writable: true,
      });
      expect(isHapticSupported()).toBe(true);
    });

    it('returns true for iPad devices', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0)' },
        writable: true,
      });
      expect(isHapticSupported()).toBe(true);
    });

    it('returns false when navigator.vibrate does not exist and not iOS', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0)' },
        writable: true,
      });
      expect(isHapticSupported()).toBe(false);
    });

    it('returns false when navigator is undefined', () => {
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true,
      });
      expect(isHapticSupported()).toBe(false);
    });
  });

  describe('vibrate', () => {
    it('vibrates once for short pattern', () => {
      const vibrateMock = vi.fn();
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: vibrateMock, userAgent: '' },
        writable: true,
      });
      vibrate('short');
      expect(vibrateMock).toHaveBeenCalledWith([50]);
    });

    it('uses a longer sequence for medium pattern', () => {
      const vibrateMock = vi.fn();
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: vibrateMock, userAgent: '' },
        writable: true,
      });
      vibrate('medium');
      expect(vibrateMock).toHaveBeenCalledWith([50, 70, 50]);
    });

    it('uses the longest sequence for warning pattern', () => {
      const vibrateMock = vi.fn();
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: vibrateMock, userAgent: '' },
        writable: true,
      });
      vibrate('warning');
      expect(vibrateMock).toHaveBeenCalledWith([50, 70, 50, 70, 50]);
    });

    it('falls back to the iOS switch-checkbox trick when vibrate is unavailable', () => {
      vi.useFakeTimers();
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4)' },
        writable: true,
      });
      const clickSpy = vi.spyOn(HTMLElement.prototype, 'click');
      vibrate('warning');
      vi.runAllTimers();
      expect(clickSpy).toHaveBeenCalledTimes(3);
      clickSpy.mockRestore();
    });

    it('does nothing on unsupported platforms', () => {
      vi.useFakeTimers();
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0)' },
        writable: true,
      });
      const clickSpy = vi.spyOn(HTMLElement.prototype, 'click');
      vibrate('short');
      vi.runAllTimers();
      expect(clickSpy).not.toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    it('does not throw when vibrate fails', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          vibrate: () => {
            throw new Error('Vibrate failed');
          },
          userAgent: '',
        },
        writable: true,
      });
      expect(() => vibrate('short')).not.toThrow();
    });
  });
});
