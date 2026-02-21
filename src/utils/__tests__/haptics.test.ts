import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isHapticSupported, vibrate } from '../haptics';

describe('haptics', () => {
  let originalNavigator: Navigator;

  beforeEach(() => {
    originalNavigator = global.navigator;
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  describe('isHapticSupported', () => {
    it('returns true when navigator.vibrate exists', () => {
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: vi.fn() },
        writable: true,
      });
      expect(isHapticSupported()).toBe(true);
    });

    it('returns false when navigator.vibrate does not exist', () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
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
    it('calls navigator.vibrate with 50ms for short pattern', () => {
      const mockVibrate = vi.fn().mockReturnValue(true);
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: mockVibrate },
        writable: true,
      });

      const result = vibrate('short');

      expect(mockVibrate).toHaveBeenCalledWith(50);
      expect(result).toBe(true);
    });

    it('calls navigator.vibrate with 100ms for medium pattern', () => {
      const mockVibrate = vi.fn().mockReturnValue(true);
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: mockVibrate },
        writable: true,
      });

      const result = vibrate('medium');

      expect(mockVibrate).toHaveBeenCalledWith(100);
      expect(result).toBe(true);
    });

    it('calls navigator.vibrate with [100, 50, 100] for warning pattern', () => {
      const mockVibrate = vi.fn().mockReturnValue(true);
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: mockVibrate },
        writable: true,
      });

      const result = vibrate('warning');

      expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100]);
      expect(result).toBe(true);
    });

    it('returns false when haptic is not supported', () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
      });

      const result = vibrate('short');

      expect(result).toBe(false);
    });

    it('returns false when navigator.vibrate throws an error', () => {
      const mockVibrate = vi.fn().mockImplementation(() => {
        throw new Error('Vibrate failed');
      });
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: mockVibrate },
        writable: true,
      });

      const result = vibrate('short');

      expect(result).toBe(false);
    });

    it('returns false when navigator.vibrate returns false', () => {
      const mockVibrate = vi.fn().mockReturnValue(false);
      Object.defineProperty(global, 'navigator', {
        value: { vibrate: mockVibrate },
        writable: true,
      });

      const result = vibrate('medium');

      expect(result).toBe(false);
    });
  });
});
