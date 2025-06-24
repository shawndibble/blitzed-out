import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useGameSettings from '../useGameSettings';
import { Settings } from '@/types/Settings';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock window.addEventListener and removeEventListener
let addEventListenerSpy: any;
let removeEventListenerSpy: any;

describe('useGameSettings', () => {
  const defaultSettings: Settings = {
    locale: 'en',
    gameMode: 'online',
    boardUpdated: false,
    room: 'PUBLIC',
  };

  const customSettings: Settings = {
    locale: 'es',
    gameMode: 'local',
    boardUpdated: true,
    room: 'PRIVATE',
    playerDialog: true,
    othersDialog: false,
    mySound: true,
    otherSound: false,
    chatSound: true,
    hideBoardActions: false,
    advancedSettings: true,
    finishRange: [3, 8],
    roomTileCount: 30,
    roomDice: 'special',
    readRoll: true,
    background: 'custom',
    roomBackgroundURL: 'https://example.com/bg.jpg',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});

    // Set up fresh spies for each test
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default settings when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useGameSettings());

      expect(result.current.settings).toEqual({
        locale: 'en',
        gameMode: 'online',
      });
      expect(localStorageMock.getItem).toHaveBeenCalledWith('gameSettings');
    });

    it('should initialize with stored settings from localStorage', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(customSettings));

      const { result } = renderHook(() => useGameSettings());

      expect(result.current.settings).toEqual({
        locale: 'en',
        gameMode: 'online',
        ...customSettings,
      });
    });

    it('should merge default settings with stored settings', () => {
      const partialSettings = {
        locale: 'fr',
        mySound: false,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(partialSettings));

      const { result } = renderHook(() => useGameSettings());

      expect(result.current.settings).toEqual({
        locale: 'en',
        gameMode: 'online',
        ...partialSettings,
      });
    });

    it('should handle malformed JSON in localStorage gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useGameSettings());

      expect(result.current.settings).toEqual({
        locale: 'en',
        gameMode: 'online',
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error parsing game settings from localStorage:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should set up storage event listener on mount', () => {
      renderHook(() => useGameSettings());

      expect(addEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    });
  });

  describe('Settings Updates', () => {
    it('should update settings and save to localStorage', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(defaultSettings));

      const { result } = renderHook(() => useGameSettings());

      const newSettings = { playerDialog: true, mySound: false };

      act(() => {
        result.current.updateSettings(newSettings);
      });

      expect(result.current.settings).toEqual({
        ...defaultSettings,
        ...newSettings,
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'gameSettings',
        JSON.stringify({
          ...defaultSettings,
          ...newSettings,
        })
      );
    });

    it('should handle partial updates correctly', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(customSettings));

      const { result } = renderHook(() => useGameSettings());

      const partialUpdate = { locale: 'de' };

      act(() => {
        result.current.updateSettings(partialUpdate);
      });

      expect(result.current.settings.locale).toBe('de');
      expect(result.current.settings.gameMode).toBe(customSettings.gameMode);
      expect(result.current.settings.playerDialog).toBe(customSettings.playerDialog);
    });

    it('should handle localStorage write errors gracefully', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(defaultSettings));
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useGameSettings());

      act(() => {
        result.current.updateSettings({ playerDialog: true });
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error saving game settings to localStorage:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should not mutate original settings object', () => {
      const originalSettings = { ...customSettings };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(originalSettings));

      const { result } = renderHook(() => useGameSettings());

      act(() => {
        result.current.updateSettings({ locale: 'it' });
      });

      expect(originalSettings).toEqual(customSettings);
    });
  });

  describe('Storage Event Handling', () => {
    it('should update settings when storage event occurs', () => {
      const { result } = renderHook(() => useGameSettings());

      const newSettings = { locale: 'pt', gameMode: 'solo' as const };

      // Get the actual event listener function that was registered
      const storageHandler = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'storage'
      )?.[1];

      act(() => {
        // Call the handler directly with a mock event
        storageHandler?.({
          key: 'gameSettings',
          newValue: JSON.stringify(newSettings),
          oldValue: null,
          storageArea: window.localStorage,
          url: 'http://localhost:3000',
        });
      });

      expect(result.current.settings).toEqual(newSettings);
    });

    it('should ignore storage events for other keys', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(defaultSettings));

      const { result } = renderHook(() => useGameSettings());
      const originalSettings = result.current.settings;

      // Get the actual event listener function that was registered
      const storageHandler = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'storage'
      )?.[1];

      act(() => {
        // Call the handler directly with a mock event
        storageHandler?.({
          key: 'otherKey',
          newValue: JSON.stringify({ someOtherData: true }),
          oldValue: null,
          storageArea: window.localStorage,
          url: 'http://localhost:3000',
        });
      });

      expect(result.current.settings).toEqual(originalSettings);
    });

    it('should ignore storage events with null newValue', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(defaultSettings));

      const { result } = renderHook(() => useGameSettings());
      const originalSettings = result.current.settings;

      // Get the actual event listener function that was registered
      const storageHandler = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'storage'
      )?.[1];

      act(() => {
        // Call the handler directly with a mock event
        storageHandler?.({
          key: 'gameSettings',
          newValue: null,
          oldValue: JSON.stringify(defaultSettings),
          storageArea: window.localStorage,
          url: 'http://localhost:3000',
        });
      });

      expect(result.current.settings).toEqual(originalSettings);
    });

    it('should handle malformed JSON in storage events gracefully', () => {
      const { result } = renderHook(() => useGameSettings());
      const originalSettings = result.current.settings;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Get the actual event listener function that was registered
      const storageHandler = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'storage'
      )?.[1];

      act(() => {
        // Call the handler directly with a mock event
        storageHandler?.({
          key: 'gameSettings',
          newValue: 'invalid json',
          oldValue: null,
          storageArea: window.localStorage,
          url: 'http://localhost:3000',
        });
      });

      expect(result.current.settings).toEqual(originalSettings);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error parsing updated game settings:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('should remove event listener on unmount', () => {
      const { unmount } = renderHook(() => useGameSettings());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    });
  });

  describe('Game Mode Handling', () => {
    it('should handle solo game mode', () => {
      const soloSettings = { ...customSettings, gameMode: 'solo' as const };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(soloSettings));

      const { result } = renderHook(() => useGameSettings());

      expect(result.current.settings.gameMode).toBe('solo');
    });

    it('should handle local game mode', () => {
      const localSettings = { ...customSettings, gameMode: 'local' as const };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(localSettings));

      const { result } = renderHook(() => useGameSettings());

      expect(result.current.settings.gameMode).toBe('local');
    });

    it('should handle online game mode', () => {
      const onlineSettings = { ...customSettings, gameMode: 'online' as const };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(onlineSettings));

      const { result } = renderHook(() => useGameSettings());

      expect(result.current.settings.gameMode).toBe('online');
    });
  });

  describe('Settings Validation', () => {
    it('should handle boolean settings correctly', () => {
      const booleanSettings = {
        playerDialog: true,
        othersDialog: false,
        mySound: true,
        otherSound: false,
        chatSound: true,
        hideBoardActions: false,
        advancedSettings: true,
        readRoll: false,
        boardUpdated: true,
        roomUpdated: false,
        roomRealtime: true,
      };

      const { result } = renderHook(() => useGameSettings());

      act(() => {
        result.current.updateSettings(booleanSettings);
      });

      Object.entries(booleanSettings).forEach(([key, value]) => {
        expect(result.current.settings[key]).toBe(value);
      });
    });

    it('should handle numeric settings correctly', () => {
      const numericSettings = {
        roomTileCount: 36,
        finishRange: [2, 12] as [number, number],
      };

      const { result } = renderHook(() => useGameSettings());

      act(() => {
        result.current.updateSettings(numericSettings);
      });

      expect(result.current.settings.roomTileCount).toBe(36);
      expect(result.current.settings.finishRange).toEqual([2, 12]);
    });

    it('should handle string settings correctly', () => {
      const stringSettings = {
        locale: 'ja',
        room: 'CUSTOMROOM',
        roomDice: 'rigged',
        background: 'gray',
        roomBackgroundURL: 'https://example.com/custom-bg.png',
        displayName: 'Custom Player Name',
      };

      const { result } = renderHook(() => useGameSettings());

      act(() => {
        result.current.updateSettings(stringSettings);
      });

      Object.entries(stringSettings).forEach(([key, value]) => {
        expect(result.current.settings[key]).toBe(value);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty object updates', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(defaultSettings));

      const { result } = renderHook(() => useGameSettings());
      const originalSettings = result.current.settings;

      act(() => {
        result.current.updateSettings({});
      });

      expect(result.current.settings).toEqual(originalSettings);
    });

    it('should handle null and undefined values', () => {
      const { result } = renderHook(() => useGameSettings());

      act(() => {
        result.current.updateSettings({
          displayName: undefined,
          roomBackgroundURL: null,
        } as any);
      });

      expect(result.current.settings.displayName).toBeUndefined();
      expect(result.current.settings.roomBackgroundURL).toBeNull();
    });

    it('should maintain type safety with unknown properties', () => {
      const { result } = renderHook(() => useGameSettings());

      act(() => {
        result.current.updateSettings({
          unknownProperty: 'should be allowed due to index signature',
        } as any);
      });

      expect((result.current.settings as any).unknownProperty).toBe(
        'should be allowed due to index signature'
      );
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should synchronize between multiple hook instances via storage events', () => {
      const { result: result1 } = renderHook(() => useGameSettings());
      const { result: result2 } = renderHook(() => useGameSettings());

      // Update settings in first instance
      act(() => {
        result1.current.updateSettings({ locale: 'ru' });
      });

      // Get all the storage event handlers that were registered
      const storageHandlers = addEventListenerSpy.mock.calls
        .filter((call) => call[0] === 'storage')
        .map((call) => call[1]);

      // Simulate storage event being received by all instances
      act(() => {
        storageHandlers.forEach((handler) => {
          handler?.({
            key: 'gameSettings',
            newValue: JSON.stringify({ locale: 'ru', gameMode: 'online' }),
            oldValue: null,
            storageArea: window.localStorage,
            url: 'http://localhost:3000',
          });
        });
      });

      // Both instances should have the same settings
      expect(result1.current.settings.locale).toBe('ru');
      expect(result2.current.settings.locale).toBe('ru');
    });
  });
});
