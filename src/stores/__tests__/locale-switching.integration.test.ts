/**
 * Integration test to verify that locale switching actually loads new data
 * This test simulates the user switching languages and confirms the database
 * contains the new locale's data and that queries return the correct results
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import localeService from '@/services/localeService';
import { migrateLocaleIfNeeded, resetMigrationStatus } from '@/services/migrationService';
import { getCustomGroups } from '@/stores/customGroups';
import { getTiles } from '@/stores/customTiles';

// Mock the settings store
const mockSetLocale = vi.fn();
vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: () => ({
    setLocale: mockSetLocale,
  }),
}));

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

// Mock window.navigator for different locales
const mockNavigator = (language: string) => {
  Object.defineProperty(window, 'navigator', {
    value: {
      language,
    },
    writable: true,
  });
};

describe('Locale Switching Integration Test', () => {
  beforeEach(async () => {
    // Clear locale service cache
    localeService.clearCache();

    // Reset localStorage mock to track migrations properly
    let localStorageData: Record<string, string> = {};

    mockLocalStorage.getItem.mockImplementation((key: string) => {
      return localStorageData[key] || null;
    });

    mockLocalStorage.setItem.mockImplementation((key: string, value: string) => {
      localStorageData[key] = value;
    });

    mockLocalStorage.removeItem.mockImplementation((key: string) => {
      delete localStorageData[key];
    });

    mockLocalStorage.clear.mockImplementation(() => {
      localStorageData = {};
    });

    // Reset migration status to ensure clean slate
    resetMigrationStatus();

    // Start with English locale
    mockNavigator('en-US');
  });

  afterEach(async () => {
    vi.clearAllMocks();
    mockSetLocale.mockClear();
  });

  it('should load new locale data when switching languages', async () => {
    // 1. Start with English - migrate English data
    let currentLocale = localeService.detectUserLocale();
    expect(currentLocale).toBe('en');

    // Migrate English locale
    const englishMigrationSuccess = await migrateLocaleIfNeeded(currentLocale);
    expect(englishMigrationSuccess).toBe(true);

    // Verify English data is loaded
    const englishGroups = await getCustomGroups({ locale: 'en' });
    const englishTiles = await getTiles({ locale: 'en' });

    console.log('English groups loaded:', englishGroups.length);
    console.log('English tiles loaded:', englishTiles.length);

    expect(englishGroups.length).toBeGreaterThan(0);
    expect(englishTiles.length).toBeGreaterThan(0);
    expect(englishGroups.every((group) => group.locale === 'en')).toBe(true);
    expect(englishTiles.every((tile) => tile.locale === 'en')).toBe(true);

    // 2. Switch to Spanish - simulate locale change
    localeService.clearCache();
    mockNavigator('es-ES');
    currentLocale = localeService.detectUserLocale();
    expect(currentLocale).toBe('es');

    // Migrate Spanish locale
    const spanishMigrationSuccess = await migrateLocaleIfNeeded(currentLocale);
    expect(spanishMigrationSuccess).toBe(true);

    // 3. Verify Spanish data is now available
    const spanishGroups = await getCustomGroups({ locale: 'es' });
    const spanishTiles = await getTiles({ locale: 'es' });

    console.log('Spanish groups loaded:', spanishGroups.length);
    console.log('Spanish tiles loaded:', spanishTiles.length);

    expect(spanishGroups.length).toBeGreaterThan(0);
    expect(spanishTiles.length).toBeGreaterThan(0);
    expect(spanishGroups.every((group) => group.locale === 'es')).toBe(true);
    expect(spanishTiles.every((tile) => tile.locale === 'es')).toBe(true);

    // 4. Verify the data is actually different between locales
    expect(
      spanishGroups.some(
        (group) => group.name.includes('alcohol') && group.label.toLowerCase().includes('alcohol')
      )
    ).toBe(true);

    expect(
      spanishTiles.some((tile) => tile.action.includes('bebe') || tile.action.includes('toma'))
    ).toBe(true);

    // 5. Verify we can query without specifying locale and get correct data
    const autoFilteredGroups = await getCustomGroups(); // Should auto-detect Spanish
    const autoFilteredTiles = await getTiles(); // Should auto-detect Spanish

    expect(autoFilteredGroups.length).toBe(spanishGroups.length);
    expect(autoFilteredTiles.length).toBe(spanishTiles.length);
    expect(autoFilteredGroups.every((group) => group.locale === 'es')).toBe(true);
    expect(autoFilteredTiles.every((tile) => tile.locale === 'es')).toBe(true);
  }, 30000); // 30 second timeout for this complex test

  it('should handle locale switching back to previously migrated locale', async () => {
    // 1. Start with English and migrate
    let currentLocale = localeService.detectUserLocale();
    expect(currentLocale).toBe('en');

    await migrateLocaleIfNeeded(currentLocale);
    const englishGroups = await getCustomGroups({ locale: 'en' });
    expect(englishGroups.length).toBeGreaterThan(0);

    // 2. Switch to Spanish and migrate
    localeService.clearCache();
    mockNavigator('es-ES');
    currentLocale = localeService.detectUserLocale();
    expect(currentLocale).toBe('es');

    await migrateLocaleIfNeeded(currentLocale);
    const spanishGroups = await getCustomGroups({ locale: 'es' });
    expect(spanishGroups.length).toBeGreaterThan(0);

    // 3. Switch back to English - should not re-migrate but data should be available
    localeService.clearCache();
    mockNavigator('en-US');
    currentLocale = localeService.detectUserLocale();
    expect(currentLocale).toBe('en');

    // This should skip migration since English was already migrated
    const englishReMigrationSuccess = await migrateLocaleIfNeeded(currentLocale);
    expect(englishReMigrationSuccess).toBe(true);

    // Verify English data is still available
    const englishGroupsAgain = await getCustomGroups({ locale: 'en' });
    expect(englishGroupsAgain.length).toBe(englishGroups.length);
    expect(englishGroupsAgain.every((group) => group.locale === 'en')).toBe(true);

    // And auto-filtered queries should return English data
    const autoFilteredGroups = await getCustomGroups();
    expect(autoFilteredGroups.length).toBe(englishGroups.length);
    expect(autoFilteredGroups.every((group) => group.locale === 'en')).toBe(true);
  }, 30000);

  it('should handle migration failure gracefully during locale switching', async () => {
    // Start with English
    let currentLocale = localeService.detectUserLocale();
    expect(currentLocale).toBe('en');

    await migrateLocaleIfNeeded(currentLocale);
    const englishGroups = await getCustomGroups({ locale: 'en' });
    expect(englishGroups.length).toBeGreaterThan(0);

    // Switch to unsupported locale (should fallback to English)
    localeService.clearCache();
    mockNavigator('fi-FI'); // Finnish - not supported
    currentLocale = localeService.detectUserLocale();
    expect(currentLocale).toBe('en'); // Should fallback to English

    // Migration should still work (using English)
    const migrationSuccess = await migrateLocaleIfNeeded(currentLocale);
    expect(migrationSuccess).toBe(true);

    // Should still have English data available
    const fallbackGroups = await getCustomGroups();
    expect(fallbackGroups.length).toBeGreaterThan(0);
    expect(fallbackGroups.every((group) => group.locale === 'en')).toBe(true);
  }, 30000);
});
