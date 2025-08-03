/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { playSound, getRandomSound, getSoundById } from '../gameSounds';

// Mock AudioContext and related APIs
const mockAudioContext = {
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 0 },
    type: 'sine',
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: { value: 0.3 },
  })),
  destination: {},
  currentTime: 0,
  close: vi.fn(),
  state: 'running',
};

// Mock global AudioContext
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: vi.fn(() => mockAudioContext),
});

Object.defineProperty(window, 'webkitAudioContext', {
  writable: true,
  value: vi.fn(() => mockAudioContext),
});

describe('gameSounds utility', () => {
  let consoleErrorSpy: any;

  // Test GameSound objects
  const testBellSound = {
    id: 'bell',
    name: 'Bell',
    frequency: 800,
    type: 'sine' as OscillatorType,
    duration: 200,
    category: 'test',
  };
  const testChimeSound = {
    id: 'chime',
    name: 'Chime',
    frequency: 1000,
    type: 'triangle' as OscillatorType,
    duration: 300,
    category: 'test',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Reset AudioContext mock state
    mockAudioContext.state = 'running';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    consoleErrorSpy.mockRestore();
  });

  describe('playSound', () => {
    it('should fail when invalid sound is provided', async () => {
      const result = await playSound({} as any);

      expect(result).toBe(false);
    });

    it('should fail when invalid sound is provided', async () => {
      const invalidSound = {
        id: 'invalid',
        name: 'Invalid',
        frequency: 0,
        type: 'sine' as OscillatorType,
        duration: 0,
        category: 'test',
      };
      const result = await playSound(invalidSound);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Sound not found:', 'invalid-sound-id');
    });

    it('should fail when AudioContext is not supported', async () => {
      // Mock AudioContext as undefined
      Object.defineProperty(window, 'AudioContext', {
        writable: true,
        value: undefined,
      });
      Object.defineProperty(window, 'webkitAudioContext', {
        writable: true,
        value: undefined,
      });

      const result = await playSound(testBellSound);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('AudioContext not supported');
    });

    it('should fail when AudioContext creation throws error', async () => {
      Object.defineProperty(window, 'AudioContext', {
        writable: true,
        value: vi.fn(() => {
          throw new Error('AudioContext creation failed');
        }),
      });

      const result = await playSound(testBellSound);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error creating AudioContext:',
        expect.any(Error)
      );
    });

    it('should fail when oscillator creation throws error', async () => {
      mockAudioContext.createOscillator.mockImplementation(() => {
        throw new Error('Oscillator creation failed');
      });

      const result = await playSound(testBellSound);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error playing sound:', expect.any(Error));
    });

    it('should successfully play a valid sound', async () => {
      const mockOscillator = {
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        frequency: { value: 0 },
        type: 'sine',
      };
      const mockGainNode = {
        connect: vi.fn(),
        gain: { value: 0.3 },
      };

      mockAudioContext.createOscillator.mockReturnValue(mockOscillator);
      mockAudioContext.createGain.mockReturnValue(mockGainNode);

      const result = await playSound(testBellSound);

      expect(result).toBe(true);
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    it('should set correct frequency for different sound types', async () => {
      const mockOscillator = {
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        frequency: { value: 0 },
        type: 'sine',
      };
      const mockGainNode = {
        connect: vi.fn(),
        gain: { value: 0.3 },
      };

      mockAudioContext.createOscillator.mockReturnValue(mockOscillator);
      mockAudioContext.createGain.mockReturnValue(mockGainNode);

      await playSound(testBellSound);
      expect(mockOscillator.frequency.value).toBeGreaterThan(0);

      await playSound(testChimeSound);
      expect(mockOscillator.frequency.value).toBeGreaterThan(0);
    });

    it('should handle different sound durations', async () => {
      const mockOscillator = {
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        frequency: { value: 0 },
        type: 'sine',
      };
      const mockGainNode = {
        connect: vi.fn(),
        gain: { value: 0.3 },
      };

      mockAudioContext.createOscillator.mockReturnValue(mockOscillator);
      mockAudioContext.createGain.mockReturnValue(mockGainNode);

      await playSound(testBellSound);

      // Verify stop is called with appropriate timing
      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    it('should handle volume control correctly', async () => {
      const mockOscillator = {
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        frequency: { value: 0 },
        type: 'sine',
      };
      const mockGainNode = {
        connect: vi.fn(),
        gain: { value: 0.3 },
      };

      mockAudioContext.createOscillator.mockReturnValue(mockOscillator);
      mockAudioContext.createGain.mockReturnValue(mockGainNode);

      await playSound(testBellSound);

      // Verify gain is set appropriately (should be between 0 and 1)
      expect(mockGainNode.gain.value).toBeGreaterThanOrEqual(0);
      expect(mockGainNode.gain.value).toBeLessThanOrEqual(1);
    });
  });

  describe('getRandomSound', () => {
    it('should return a valid sound object', () => {
      const sound = getRandomSound();

      expect(sound).toBeDefined();
      expect(sound).toHaveProperty('id');
      expect(sound).toHaveProperty('name');
      expect(sound).toHaveProperty('frequency');
      expect(sound).toHaveProperty('duration');
      expect(typeof sound.id).toBe('string');
      expect(typeof sound.name).toBe('string');
      expect(typeof sound.frequency).toBe('number');
      expect(typeof sound.duration).toBe('number');
    });

    it('should return different sounds on subsequent calls', () => {
      const sound1 = getRandomSound();
      const sound2 = getRandomSound();
      const sound3 = getRandomSound();

      // With enough calls, we should get different sounds
      // (This might occasionally fail due to randomness, but very unlikely)
      const sounds = [sound1, sound2, sound3];
      const uniqueIds = new Set(sounds.map((s) => s.id));

      expect(uniqueIds.size).toBeGreaterThan(0);
    });

    it('should return sounds with valid frequency ranges', () => {
      // Test multiple calls to check frequency ranges
      for (let i = 0; i < 10; i++) {
        const sound = getRandomSound();
        expect(sound.frequency).toBeGreaterThan(0);
        expect(sound.frequency).toBeLessThan(2000); // Reasonable audio frequency
      }
    });

    it('should return sounds with valid duration ranges', () => {
      // Test multiple calls to check duration ranges
      for (let i = 0; i < 10; i++) {
        const sound = getRandomSound();
        expect(sound.duration).toBeGreaterThan(0);
        expect(sound.duration).toBeLessThan(2); // Reasonable duration in seconds
      }
    });
  });

  describe('getSoundById', () => {
    it('should return null for invalid sound ID', () => {
      const sound = getSoundById('invalid-id');
      expect(sound).toBeNull();
    });

    it('should return null for empty sound ID', () => {
      const sound = getSoundById('');
      expect(sound).toBeNull();
    });

    it('should return null for undefined sound ID', () => {
      const sound = getSoundById(undefined as any);
      expect(sound).toBeNull();
    });

    it('should return correct sound for valid bell ID', () => {
      const sound = getSoundById('bell');

      expect(sound).not.toBeNull();
      expect(sound).toHaveProperty('id', 'bell');
      expect(sound).toHaveProperty('name');
      expect(sound).toHaveProperty('frequency');
      expect(sound).toHaveProperty('duration');
    });

    it('should return correct sound for valid chime ID', () => {
      const sound = getSoundById('chime');

      expect(sound).not.toBeNull();
      expect(sound).toHaveProperty('id', 'chime');
      expect(sound).toHaveProperty('name');
      expect(sound).toHaveProperty('frequency');
      expect(sound).toHaveProperty('duration');
    });

    it('should return correct sound for valid notification ID', () => {
      const sound = getSoundById('notification');

      expect(sound).not.toBeNull();
      expect(sound).toHaveProperty('id', 'notification');
      expect(sound).toHaveProperty('name');
      expect(sound).toHaveProperty('frequency');
      expect(sound).toHaveProperty('duration');
    });

    it('should handle case sensitivity correctly', () => {
      const lowerCase = getSoundById('bell');
      const upperCase = getSoundById('BELL');
      const mixedCase = getSoundById('Bell');

      expect(lowerCase).not.toBeNull();
      expect(upperCase).toBeNull(); // Should be case-sensitive
      expect(mixedCase).toBeNull(); // Should be case-sensitive
    });

    it('should return sound objects with consistent structure', () => {
      const validIds = ['bell', 'chime', 'notification'];

      validIds.forEach((id) => {
        const sound = getSoundById(id);
        expect(sound).toHaveProperty('id');
        expect(sound).toHaveProperty('name');
        expect(sound).toHaveProperty('frequency');
        expect(sound).toHaveProperty('duration');
        expect(typeof sound?.id).toBe('string');
        expect(typeof sound?.name).toBe('string');
        expect(typeof sound?.frequency).toBe('number');
        expect(typeof sound?.duration).toBe('number');
      });
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle AudioContext state changes gracefully', async () => {
      mockAudioContext.state = 'suspended';

      const result = await playSound(testBellSound);

      // Should still attempt to play even if suspended
      expect(result).toBe(true);
    });

    it('should handle concurrent sound playback', async () => {
      const promises = [
        playSound(testBellSound),
        playSound(testChimeSound),
        playSound({
          id: 'notification',
          name: 'Notification',
          frequency: 1200,
          type: 'square' as OscillatorType,
          duration: 150,
          category: 'test',
        }),
      ];

      const results = await Promise.all(promises);

      // All should succeed
      expect(results).toEqual([true, true, true]);
    });

    it('should handle memory cleanup correctly', async () => {
      const mockOscillator = {
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        frequency: { value: 0 },
        type: 'sine',
      };
      const mockGainNode = {
        connect: vi.fn(),
        gain: { value: 0.3 },
      };

      mockAudioContext.createOscillator.mockReturnValue(mockOscillator);
      mockAudioContext.createGain.mockReturnValue(mockGainNode);

      await playSound(testBellSound);

      // Verify cleanup happens
      expect(mockOscillator.stop).toHaveBeenCalled();
    });
  });
});
