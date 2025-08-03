/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { playSound, getRandomSound, getSoundById, AVAILABLE_SOUNDS } from '../gameSounds';

// Simple mock for AudioContext
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
};

// Mock global AudioContext
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: vi.fn(() => mockAudioContext),
});

describe('gameSounds utility - simple tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AVAILABLE_SOUNDS', () => {
    it('should have available sounds', () => {
      expect(AVAILABLE_SOUNDS.length).toBeGreaterThan(0);
    });

    it('should have sounds with required properties', () => {
      AVAILABLE_SOUNDS.forEach((sound) => {
        expect(sound).toHaveProperty('id');
        expect(sound).toHaveProperty('name');
        expect(sound).toHaveProperty('frequency');
        expect(sound).toHaveProperty('type');
        expect(sound).toHaveProperty('duration');
      });
    });
  });

  describe('playSound', () => {
    it('should return true for valid sound', async () => {
      const sound = AVAILABLE_SOUNDS[0];
      const result = await playSound(sound);
      expect(result).toBe(true);
    });

    it('should return false for invalid sound', async () => {
      const result = await playSound(null as any);
      expect(result).toBe(false);
    });

    it('should create AudioContext and oscillator for valid sound', async () => {
      const sound = AVAILABLE_SOUNDS[0];
      await playSound(sound);

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });
  });

  describe('getRandomSound', () => {
    it('should return a valid sound object', () => {
      const sound = getRandomSound();
      expect(AVAILABLE_SOUNDS).toContain(sound);
    });
  });

  describe('getSoundById', () => {
    it('should return correct sound for valid ID', () => {
      const sound = getSoundById('bell');
      expect(sound?.id).toBe('bell');
      expect(sound?.name).toBe('Bell');
    });

    it('should return null for invalid ID', () => {
      const sound = getSoundById('invalid');
      expect(sound).toBeNull();
    });

    it('should return null for empty ID', () => {
      const sound = getSoundById('');
      expect(sound).toBeNull();
    });
  });
});
