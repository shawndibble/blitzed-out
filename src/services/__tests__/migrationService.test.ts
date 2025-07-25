/**
 * Tests for the migration service locale-specific functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isLocaleMigrated,
  getMigratedLocales,
  migrateLocaleIfNeeded,
  resetMigrationStatus,
} from '../migrationService';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock the migration function
vi.mock('../migrationService', async () => {
  const actual = await vi.importActual('../migrationService');
  return {
    ...actual,
    migrateActionGroupsForLocale: vi.fn(),
  };
});

describe('Migration Service - Locale Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isLocaleMigrated', () => {
    it('should return false when no migration data exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      expect(isLocaleMigrated('en')).toBe(false);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('blitzed-out-locale-migrations');
    });

    it('should return false when locale is not in migrated list', () => {
      const mockStatus = {
        version: '2.1.0',
        migratedLocales: ['en'],
        lastUpdated: new Date().toISOString(),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStatus));

      expect(isLocaleMigrated('es')).toBe(false);
    });

    it('should return true when locale is in migrated list', () => {
      const mockStatus = {
        version: '2.1.0',
        migratedLocales: ['en', 'es'],
        lastUpdated: new Date().toISOString(),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStatus));

      expect(isLocaleMigrated('es')).toBe(true);
    });

    it('should return false when version mismatch', () => {
      const mockStatus = {
        version: '1.0.0',
        migratedLocales: ['en', 'es'],
        lastUpdated: new Date().toISOString(),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStatus));

      expect(isLocaleMigrated('es')).toBe(false);
    });

    it('should handle malformed JSON gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      expect(isLocaleMigrated('en')).toBe(false);
    });
  });

  describe('getMigratedLocales', () => {
    it('should return empty array when no migration data exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      expect(getMigratedLocales()).toEqual([]);
    });

    it('should return migrated locales list', () => {
      const mockStatus = {
        version: '2.1.0',
        migratedLocales: ['en', 'es', 'fr'],
        lastUpdated: new Date().toISOString(),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStatus));

      expect(getMigratedLocales()).toEqual(['en', 'es', 'fr']);
    });

    it('should return empty array when version mismatch', () => {
      const mockStatus = {
        version: '1.0.0',
        migratedLocales: ['en', 'es'],
        lastUpdated: new Date().toISOString(),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStatus));

      expect(getMigratedLocales()).toEqual([]);
    });

    it('should handle malformed JSON gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      expect(getMigratedLocales()).toEqual([]);
    });
  });

  describe('resetMigrationStatus', () => {
    it('should remove both migration status keys', () => {
      resetMigrationStatus();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'blitzed-out-action-groups-migration'
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('blitzed-out-locale-migrations');
    });
  });

  describe('migrateLocaleIfNeeded', () => {
    it('should skip migration if locale already migrated', async () => {
      const mockStatus = {
        version: '2.1.0',
        migratedLocales: ['en'],
        lastUpdated: new Date().toISOString(),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStatus));

      const result = await migrateLocaleIfNeeded('en');

      expect(result).toBe(true);
      // Should not call the actual migration function since it's already migrated
    });

    it('should run migration if locale not yet migrated', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      // Mock the migration function to succeed
      const { migrateActionGroupsForLocale } = await import('../migrationService');
      vi.mocked(migrateActionGroupsForLocale).mockResolvedValue(true);

      const result = await migrateLocaleIfNeeded('es');

      expect(result).toBe(true);
      expect(migrateActionGroupsForLocale).toHaveBeenCalledWith('es');
    });

    it('should handle migration failure gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      // Mock the migration function to fail
      const { migrateActionGroupsForLocale } = await import('../migrationService');
      vi.mocked(migrateActionGroupsForLocale).mockResolvedValue(false);

      const result = await migrateLocaleIfNeeded('es');

      expect(result).toBe(false);
      expect(migrateActionGroupsForLocale).toHaveBeenCalledWith('es');
    });

    it('should handle migration exception gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      // Mock the migration function to throw
      const { migrateActionGroupsForLocale } = await import('../migrationService');
      vi.mocked(migrateActionGroupsForLocale).mockRejectedValue(new Error('Migration failed'));

      const result = await migrateLocaleIfNeeded('es');

      expect(result).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    it('should track multiple locale migrations', async () => {
      // Start with no migrations
      mockLocalStorage.getItem.mockReturnValue(null);

      // Mock successful migrations
      const { migrateActionGroupsForLocale } = await import('../migrationService');
      vi.mocked(migrateActionGroupsForLocale).mockResolvedValue(true);

      // First migration should run
      await migrateLocaleIfNeeded('en');
      expect(migrateActionGroupsForLocale).toHaveBeenCalledWith('en');

      // Mock the updated state after first migration
      const firstMigrationStatus = {
        version: '2.1.0',
        migratedLocales: ['en'],
        lastUpdated: new Date().toISOString(),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(firstMigrationStatus));

      // Second locale migration should also run
      vi.mocked(migrateActionGroupsForLocale).mockClear();
      await migrateLocaleIfNeeded('es');
      expect(migrateActionGroupsForLocale).toHaveBeenCalledWith('es');

      // Mock the updated state after second migration
      const secondMigrationStatus = {
        version: '2.1.0',
        migratedLocales: ['en', 'es'],
        lastUpdated: new Date().toISOString(),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(secondMigrationStatus));

      // Third attempt on already migrated locale should skip
      vi.mocked(migrateActionGroupsForLocale).mockClear();
      await migrateLocaleIfNeeded('en');
      expect(migrateActionGroupsForLocale).not.toHaveBeenCalled();
    });
  });
});
