/**
 * File discovery utilities for dynamic locale and game mode detection
 */

import { SUPPORTED_LANGUAGES, GAME_MODES } from './constants';
import { logError } from './errorHandling';
import i18n from '@/i18n';

/**
 * Get current user language from i18next with fallbacks
 */
export const getCurrentLanguage = async (): Promise<string> => {
  try {
    // First try: get current language from i18next using proper API
    const resolved = i18n.resolvedLanguage;
    if (resolved && resolved !== 'undefined') {
      return resolved;
    }

    // Second try: get language from i18next instance
    const currentLang = i18n.language;
    if (currentLang && currentLang !== 'undefined') {
      return currentLang;
    }

    // Third try: localStorage fallback
    const storedLanguage = localStorage.getItem('i18nextLng');
    if (storedLanguage && storedLanguage !== 'undefined') {
      return storedLanguage;
    }

    // Fourth try: browser language with proper validation
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.split('-')[0];
      if (SUPPORTED_LANGUAGES.includes(browserLang as (typeof SUPPORTED_LANGUAGES)[number])) {
        return browserLang;
      }
    }

    // Final fallback: English
    return 'en';
  } catch (error) {
    logError('error', 'getCurrentLanguage', error);
    return 'en'; // Safe fallback
  }
};

/**
 * Dynamically discover available locales from the filesystem
 */
export const getAvailableLocales = async (): Promise<string[]> => {
  const locales = [...SUPPORTED_LANGUAGES];
  const existingLocales: string[] = [];

  for (const locale of locales) {
    try {
      // Test if locale exists by trying to import translation file
      await import(`@/locales/${locale}/translation.json`);
      existingLocales.push(locale);
    } catch {
      // Locale doesn't exist, skip it
    }
  }

  return existingLocales;
};

/**
 * Dynamically discover available game modes for a locale
 */
export const getAvailableGameModes = async (locale: string): Promise<string[]> => {
  const gameModes = [...GAME_MODES];
  const existingGameModes: string[] = [];

  for (const gameMode of gameModes) {
    try {
      // Test if gameMode exists by trying to import any known file
      await import(`@/locales/${locale}/${gameMode}/alcohol.json`);
      existingGameModes.push(gameMode);
    } catch {
      // Game mode doesn't exist for this locale, skip it
    }
  }

  return existingGameModes;
};

/**
 * Dynamically discover action group names for a specific locale and game mode
 * Uses Vite's import.meta.glob to automatically discover all JSON files at build time
 */
export const getActionGroupNames = async (locale: string, gameMode: string): Promise<string[]> => {
  // Use Vite's glob import to get all action group files for all locales and game modes
  // This automatically discovers files at build time, eliminating the need for hardcoded lists
  const allActionFiles = import.meta.glob('@/locales/*/*/*.json');

  const existingGroups: string[] = [];
  const targetPath = `@/locales/${locale}/${gameMode}/`;

  // Filter for files matching the current locale and game mode
  for (const filePath of Object.keys(allActionFiles)) {
    // Check both @/ prefixed paths and resolved paths
    const pathVariants = [
      targetPath, // @/locales/en/online/
      targetPath.replace('@/', '/src/'), // /src/locales/en/online/
      `/${locale}/${gameMode}/`, // /en/online/
      `locales/${locale}/${gameMode}/`, // locales/en/online/
    ];

    const pathMatches = pathVariants.some((variant) => filePath.includes(variant));
    if (pathMatches) {
      // Extract the group name from the file path
      const fileName = filePath.split('/').pop();
      if (fileName?.endsWith('.json')) {
        const groupName = fileName.replace('.json', '');

        try {
          // Verify the file can be imported (additional safety check)
          await allActionFiles[filePath]();
          existingGroups.push(groupName);
        } catch (error) {
          // File exists but can't be imported, skip it
          logError('warn', `getActionGroupNames: ${groupName} for ${locale}/${gameMode}`, error);
        }
      }
    }
  }

  return existingGroups.sort(); // Sort for consistent ordering
};
