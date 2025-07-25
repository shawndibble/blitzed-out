/**
 * Integration tests for locale-specific filtering in Dexie DB
 * Tests that custom groups and tiles are filtered by current browser locale
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Dexie from 'dexie';
import localeService from '@/services/localeService';

// Create a test database instance
class TestDatabase extends Dexie {
  customTiles!: Dexie.Table<any, number>;
  customGroups!: Dexie.Table<any, string>;

  constructor() {
    super('TestBlitzedOut', { addons: [] });

    this.version(1).stores({
      customTiles: '++id, group, intensity, action, isEnabled, tags, gameMode, isCustom, locale',
      customGroups: '++id, name, label, locale, gameMode, isDefault, createdAt',
    });
  }
}

let testDb: TestDatabase;

// Mock functions that use the test database
const getTiles = async (filters: any = {}) => {
  // Automatically filter by current locale if not specified
  if (!filters.locale) {
    filters.locale = localeService.detectUserLocale();
  }

  let query = testDb.customTiles.toCollection();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query = query.filter((item: any) => item[key] === value);
  });

  return await query.toArray();
};

const getCustomGroups = async (filters: any = {}) => {
  // Automatically filter by current locale if not specified
  if (!filters.locale) {
    filters.locale = localeService.detectUserLocale();
  }

  let query = testDb.customGroups.toCollection();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query = query.filter((item: any) => item[key] === value);
  });

  return await query.toArray();
};

// Mock window.navigator for different locales
const mockNavigator = (language: string) => {
  Object.defineProperty(window, 'navigator', {
    value: {
      language,
    },
    writable: true,
  });
};

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

describe('Locale-specific Dexie DB filtering', () => {
  beforeEach(async () => {
    // Create a fresh test database instance
    testDb = new TestDatabase();
    await testDb.open();

    // Clear locale service cache
    localeService.clearCache();

    // Reset localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null);

    // Seed the database with test data for multiple locales
    await seedTestData();
  });

  afterEach(async () => {
    // Clean up after each test
    if (testDb) {
      await testDb.delete();
      testDb.close();
    }
    vi.clearAllMocks();
  });

  /**
   * Seed the database with test data in multiple locales
   */
  async function seedTestData() {
    // English custom groups and tiles
    await testDb.customGroups.bulkAdd([
      {
        id: 'group-en-1',
        name: 'English Group 1',
        locale: 'en',
        gameMode: 'online',
        isDefault: false,
        intensities: [
          { value: 1, label: 'Light English' },
          { value: 2, label: 'Medium English' },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'group-en-2',
        name: 'English Group 2',
        locale: 'en',
        gameMode: 'local',
        isDefault: false,
        intensities: [{ value: 1, label: 'Light English 2' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await testDb.customTiles.bulkAdd([
      {
        locale: 'en',
        gameMode: 'online',
        group: 'English Group 1',
        action: 'English Action 1',
        intensity: 1,
        isCustom: 1,
        isEnabled: 1,
        tags: ['english', 'test'],
      },
      {
        locale: 'en',
        gameMode: 'local',
        group: 'English Group 2',
        action: 'English Action 2',
        intensity: 2,
        isCustom: 1,
        isEnabled: 1,
        tags: ['english', 'local'],
      },
    ]);

    // Spanish custom groups and tiles
    await testDb.customGroups.bulkAdd([
      {
        id: 'group-es-1',
        name: 'Grupo Español 1',
        locale: 'es',
        gameMode: 'online',
        isDefault: false,
        intensities: [
          { value: 1, label: 'Ligero Español' },
          { value: 2, label: 'Medio Español' },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'group-es-2',
        name: 'Grupo Español 2',
        locale: 'es',
        gameMode: 'local',
        isDefault: false,
        intensities: [{ value: 1, label: 'Ligero Español 2' }],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await testDb.customTiles.bulkAdd([
      {
        locale: 'es',
        gameMode: 'online',
        group: 'Grupo Español 1',
        action: 'Acción Española 1',
        intensity: 1,
        isCustom: 1,
        isEnabled: 1,
        tags: ['español', 'test'],
      },
      {
        locale: 'es',
        gameMode: 'local',
        group: 'Grupo Español 2',
        action: 'Acción Española 2',
        intensity: 2,
        isCustom: 1,
        isEnabled: 1,
        tags: ['español', 'local'],
      },
    ]);

    // French custom groups and tiles
    await testDb.customGroups.bulkAdd([
      {
        id: 'group-fr-1',
        name: 'Groupe Français 1',
        locale: 'fr',
        gameMode: 'online',
        isDefault: false,
        intensities: [
          { value: 1, label: 'Léger Français' },
          { value: 2, label: 'Moyen Français' },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await testDb.customTiles.bulkAdd([
      {
        locale: 'fr',
        gameMode: 'online',
        group: 'Groupe Français 1',
        action: 'Action Française 1',
        intensity: 1,
        isCustom: 1,
        isEnabled: 1,
        tags: ['français', 'test'],
      },
    ]);
  }

  describe('English browser locale', () => {
    it('should only show English custom groups and tiles when browser is set to English', async () => {
      // Mock browser locale to English
      mockNavigator('en-US');

      // Get current locale (should be 'en')
      const currentLocale = localeService.detectUserLocale();
      expect(currentLocale).toBe('en');

      // Get filtered groups - should only return English groups
      const groups = await getCustomGroups({ locale: currentLocale });
      expect(groups).toHaveLength(2);
      expect(groups.every((group) => group.locale === 'en')).toBe(true);
      expect(groups.some((group) => group.name === 'English Group 1')).toBe(true);
      expect(groups.some((group) => group.name === 'English Group 2')).toBe(true);
      expect(groups.some((group) => group.name === 'Grupo Español 1')).toBe(false);
      expect(groups.some((group) => group.name === 'Groupe Français 1')).toBe(false);

      // Get filtered tiles - should only return English tiles
      const tiles = await getTiles({ locale: currentLocale });
      expect(tiles).toHaveLength(2);
      expect(tiles.every((tile) => tile.locale === 'en')).toBe(true);
      expect(tiles.some((tile) => tile.action === 'English Action 1')).toBe(true);
      expect(tiles.some((tile) => tile.action === 'English Action 2')).toBe(true);
      expect(tiles.some((tile) => tile.action === 'Acción Española 1')).toBe(false);
      expect(tiles.some((tile) => tile.action === 'Action Française 1')).toBe(false);
    });
  });

  describe('Spanish browser locale', () => {
    it('should only show Spanish custom groups and tiles when browser is set to Spanish', async () => {
      // Mock browser locale to Spanish
      mockNavigator('es-ES');

      // Get current locale (should be 'es')
      const currentLocale = localeService.detectUserLocale();
      expect(currentLocale).toBe('es');

      // Get filtered groups - should only return Spanish groups
      const groups = await getCustomGroups({ locale: currentLocale });
      expect(groups).toHaveLength(2);
      expect(groups.every((group) => group.locale === 'es')).toBe(true);
      expect(groups.some((group) => group.name === 'Grupo Español 1')).toBe(true);
      expect(groups.some((group) => group.name === 'Grupo Español 2')).toBe(true);
      expect(groups.some((group) => group.name === 'English Group 1')).toBe(false);
      expect(groups.some((group) => group.name === 'Groupe Français 1')).toBe(false);

      // Get filtered tiles - should only return Spanish tiles
      const tiles = await getTiles({ locale: currentLocale });
      expect(tiles).toHaveLength(2);
      expect(tiles.every((tile) => tile.locale === 'es')).toBe(true);
      expect(tiles.some((tile) => tile.action === 'Acción Española 1')).toBe(true);
      expect(tiles.some((tile) => tile.action === 'Acción Española 2')).toBe(true);
      expect(tiles.some((tile) => tile.action === 'English Action 1')).toBe(false);
      expect(tiles.some((tile) => tile.action === 'Action Française 1')).toBe(false);
    });
  });

  describe('Unsupported browser locale fallback', () => {
    it('should only show English custom groups and tiles when browser is set to unsupported locale (Finnish)', async () => {
      // Mock browser locale to Finnish (unsupported)
      mockNavigator('fi-FI');

      // Get current locale (should fallback to 'en')
      const currentLocale = localeService.detectUserLocale();
      expect(currentLocale).toBe('en'); // Should fallback to English

      // Get filtered groups - should only return English groups as fallback
      const groups = await getCustomGroups({ locale: currentLocale });
      expect(groups).toHaveLength(2);
      expect(groups.every((group) => group.locale === 'en')).toBe(true);
      expect(groups.some((group) => group.name === 'English Group 1')).toBe(true);
      expect(groups.some((group) => group.name === 'English Group 2')).toBe(true);
      expect(groups.some((group) => group.name === 'Grupo Español 1')).toBe(false);
      expect(groups.some((group) => group.name === 'Groupe Français 1')).toBe(false);

      // Get filtered tiles - should only return English tiles as fallback
      const tiles = await getTiles({ locale: currentLocale });
      expect(tiles).toHaveLength(2);
      expect(tiles.every((tile) => tile.locale === 'en')).toBe(true);
      expect(tiles.some((tile) => tile.action === 'English Action 1')).toBe(true);
      expect(tiles.some((tile) => tile.action === 'English Action 2')).toBe(true);
      expect(tiles.some((tile) => tile.action === 'Acción Española 1')).toBe(false);
      expect(tiles.some((tile) => tile.action === 'Action Française 1')).toBe(false);
    });
  });

  describe('Dynamic locale filtering', () => {
    it('should return different data when locale changes', async () => {
      // Start with English
      mockNavigator('en-US');
      let currentLocale = localeService.detectUserLocale();
      expect(currentLocale).toBe('en');

      let groups = await getCustomGroups({ locale: currentLocale });
      expect(groups).toHaveLength(2);
      expect(groups.every((group) => group.locale === 'en')).toBe(true);

      // Clear cache and switch to Spanish
      localeService.clearCache();
      mockNavigator('es-ES');
      currentLocale = localeService.detectUserLocale();
      expect(currentLocale).toBe('es');

      groups = await getCustomGroups({ locale: currentLocale });
      expect(groups).toHaveLength(2);
      expect(groups.every((group) => group.locale === 'es')).toBe(true);
    });
  });
});
