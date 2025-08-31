/**
 * File discovery utilities for dynamic locale and game mode detection
 */

import { SUPPORTED_LANGUAGES } from './constants';
import { logError } from './errorHandling';
import i18n from '@/i18n';

/**
 * Get current user language from i18next with fallbacks
 */
export const getCurrentLanguage = async (): Promise<string> => {
  try {
    // First try: get current language from i18next using proper API
    const resolved = i18n.resolvedLanguage;
    if (resolved !== undefined) {
      return resolved;
    }

    // Second try: get language from i18next instance
    const currentLang = i18n.language;
    if (currentLang !== undefined) {
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
 * Dynamically discover action group names for a specific locale and game mode
 * Uses bundled translation files for better performance
 */
export const getActionGroupNames = async (locale: string, gameMode: string): Promise<string[]> => {
  try {
    // Import the bundle for the specified locale and game mode
    const bundleFile = await import(`@/locales/${locale}/${gameMode}-bundle.json`);

    // Return all keys (group names) from the bundle
    return Object.keys(bundleFile).sort(); // Sort for consistent ordering
  } catch (error) {
    // Bundle doesn't exist or can't be imported
    logError('warn', `getActionGroupNames: Bundle not found for ${locale}/${gameMode}`, error);
    return [];
  }
};
