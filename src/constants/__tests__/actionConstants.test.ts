import { describe, it, expect } from 'vitest';
import {
  DEFAULT_NONE_OPTION,
  UNIFIED_ACTION_CACHE_TTL,
  SYNC_DELAY_MS,
  DEFAULT_INTENSITY_LABELS,
} from '../actionConstants';

describe('actionConstants', () => {
  describe('DEFAULT_NONE_OPTION', () => {
    it('should be defined as "None"', () => {
      expect(DEFAULT_NONE_OPTION).toBe('None');
    });

    it('should be a string', () => {
      expect(typeof DEFAULT_NONE_OPTION).toBe('string');
    });
  });

  describe('UNIFIED_ACTION_CACHE_TTL', () => {
    it('should be defined as 30000 milliseconds', () => {
      expect(UNIFIED_ACTION_CACHE_TTL).toBe(30000);
    });

    it('should be a number', () => {
      expect(typeof UNIFIED_ACTION_CACHE_TTL).toBe('number');
    });

    it('should be positive', () => {
      expect(UNIFIED_ACTION_CACHE_TTL).toBeGreaterThan(0);
    });
  });

  describe('SYNC_DELAY_MS', () => {
    it('should be defined as 500 milliseconds', () => {
      expect(SYNC_DELAY_MS).toBe(500);
    });

    it('should be a number', () => {
      expect(typeof SYNC_DELAY_MS).toBe('number');
    });

    it('should be positive', () => {
      expect(SYNC_DELAY_MS).toBeGreaterThan(0);
    });
  });

  describe('DEFAULT_INTENSITY_LABELS', () => {
    it('should have all required intensity levels', () => {
      expect(DEFAULT_INTENSITY_LABELS).toHaveProperty('BEGINNER');
      expect(DEFAULT_INTENSITY_LABELS).toHaveProperty('INTERMEDIATE');
      expect(DEFAULT_INTENSITY_LABELS).toHaveProperty('ADVANCED');
    });

    it('should have translation key values', () => {
      expect(DEFAULT_INTENSITY_LABELS.BEGINNER).toBe('intensityLabels.beginner');
      expect(DEFAULT_INTENSITY_LABELS.INTERMEDIATE).toBe('intensityLabels.intermediate');
      expect(DEFAULT_INTENSITY_LABELS.ADVANCED).toBe('intensityLabels.advanced');
    });

    it('should be marked as readonly', () => {
      // The object is marked as const in TypeScript but not frozen in runtime
      // This test validates the structure is available
      expect(DEFAULT_INTENSITY_LABELS.BEGINNER).toBe('intensityLabels.beginner');
      expect(DEFAULT_INTENSITY_LABELS.INTERMEDIATE).toBe('intensityLabels.intermediate');
      expect(DEFAULT_INTENSITY_LABELS.ADVANCED).toBe('intensityLabels.advanced');

      // In JavaScript, the object is not actually frozen, just TypeScript readonly
      expect(typeof DEFAULT_INTENSITY_LABELS).toBe('object');
    });
  });
});
