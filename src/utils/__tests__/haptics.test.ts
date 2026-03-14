import { describe, it, expect, vi, beforeEach, afterEach, MockedFunction } from 'vitest';
import { haptic } from 'ios-haptics';
import { isHapticSupported, vibrate } from '../haptics';

vi.mock('ios-haptics', () => {
  const mockFn = vi.fn() as MockedFunction<() => void> & {
    error: MockedFunction<() => void>;
    confirm: MockedFunction<() => void>;
  };
  mockFn.error = vi.fn();
  mockFn.confirm = vi.fn();
  return { haptic: mockFn };
});

const mockedHaptic = haptic as unknown as MockedFunction<() => void> & {
  error: MockedFunction<() => void>;
  confirm: MockedFunction<() => void>;
};

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
    it('calls haptic once for short pattern', () => {
      vibrate('short');
      expect(mockedHaptic).toHaveBeenCalledTimes(1);
    });

    it('calls haptic twice for medium pattern', () => {
      vibrate('medium');
      expect(mockedHaptic).toHaveBeenCalledTimes(2);
    });

    it('calls haptic.error for warning pattern', () => {
      vibrate('warning');
      expect(mockedHaptic.error).toHaveBeenCalledTimes(1);
    });

    it('does not throw when haptic fails', () => {
      mockedHaptic.mockImplementationOnce(() => {
        throw new Error('Haptic failed');
      });

      expect(() => vibrate('short')).not.toThrow();
    });
  });
});
