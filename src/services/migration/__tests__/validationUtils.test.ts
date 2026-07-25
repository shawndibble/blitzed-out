import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { verifyMigrationIntegrity, fixMigrationStatusCorruption } from '../validationUtils';
import { BACKGROUND_MIGRATION_KEY, MIGRATION_KEY } from '../constants';
import * as statusManager from '../statusManager';

// Only the true external boundary (Dexie-backed store) is mocked. statusManager
// runs for real against jsdom's localStorage so these tests exercise the real
// corruption-detection logic end to end, not a stand-in for it.
vi.mock('@/stores/customGroups', () => ({
  getAllAvailableGroups: vi.fn(),
}));

import { getAllAvailableGroups } from '@/stores/customGroups';

const setBackgroundMigrationComplete = (locale: string) => {
  localStorage.setItem(
    BACKGROUND_MIGRATION_KEY,
    JSON.stringify({
      version: '2.6.0',
      completedLanguages: [locale],
      inProgress: false,
    })
  );
};

describe('validationUtils', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(getAllAvailableGroups).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('verifyMigrationIntegrity', () => {
    it('returns true when localStorage does not claim migration is complete', async () => {
      // No BACKGROUND_MIGRATION_KEY written, so isCurrentLanguageMigrationCompleted
      // is false and the function must short-circuit without touching the store.
      const result = await verifyMigrationIntegrity('en', 'online');

      expect(result).toBe(true);
      expect(getAllAvailableGroups).not.toHaveBeenCalled();
    });

    it('detects corruption: localStorage says complete but the database is empty', async () => {
      setBackgroundMigrationComplete('en');
      vi.mocked(getAllAvailableGroups).mockResolvedValue([]);

      const result = await verifyMigrationIntegrity('en', 'online');

      expect(result).toBe(false);
    });

    it('reports healthy when localStorage says complete and the database has data', async () => {
      setBackgroundMigrationComplete('en');
      vi.mocked(getAllAvailableGroups).mockResolvedValue([
        { id: '1', name: 'group1', label: 'Group 1' },
      ] as any);

      const result = await verifyMigrationIntegrity('en', 'online');

      expect(result).toBe(true);
    });

    it('fails closed (false) when the integrity check itself throws', async () => {
      setBackgroundMigrationComplete('en');
      vi.mocked(getAllAvailableGroups).mockRejectedValue(new Error('Dexie unavailable'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await verifyMigrationIntegrity('en', 'online');

      expect(result).toBe(false);
    });
  });

  describe('fixMigrationStatusCorruption', () => {
    it('clears migration status keys from localStorage', () => {
      localStorage.setItem(MIGRATION_KEY, 'stale');
      setBackgroundMigrationComplete('en');

      fixMigrationStatusCorruption();

      expect(localStorage.getItem(MIGRATION_KEY)).toBeNull();
      expect(localStorage.getItem(BACKGROUND_MIGRATION_KEY)).toBeNull();
    });

    it('swallows errors from the underlying reset instead of throwing', () => {
      vi.spyOn(statusManager, 'resetMigrationStatus').mockImplementation(() => {
        throw new Error('boom');
      });
      vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => fixMigrationStatusCorruption()).not.toThrow();
    });
  });
});
