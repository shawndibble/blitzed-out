/**
 * i18n Helper utilities and constants
 * @deprecated Use localeService for dynamic language management
 */

import localeService from './localeService';

// Legacy export for backward compatibility
// New code should use localeService.getAvailableLanguages()
export const languages: Record<string, { label: string; voice: string }> = {
  en: {
    label: 'English',
    voice: 'Google UK English Male',
  },
  es: {
    label: 'Español',
    voice: 'Google español de Estados Unidos',
  },
  fr: {
    label: 'Française',
    voice: 'Google français',
  },
};

/**
 * Get available languages using the new dynamic system
 * @returns Array of available language metadata
 */
export const getAvailableLanguages = () => {
  return localeService.getAvailableLanguages();
};

/**
 * Get language metadata for a specific locale
 * @param locale - Language code (e.g., 'en', 'es', 'fr')
 * @returns Language metadata or undefined if not found
 */
export const getLanguageMetadata = (locale: string) => {
  return localeService.getLanguageMetadata(locale);
};

/**
 * Check if a language is currently loaded
 * @param locale - Language code to check
 * @returns True if language is loaded, false otherwise
 */
export const isLanguageLoaded = (locale: string) => {
  return localeService.isLanguageLoaded(locale);
};

/**
 * Preload a language without switching to it
 * Useful for optimizing user experience
 * @param locale - Language code to preload
 */
export const preloadLanguage = async (locale: string) => {
  try {
    await localeService.preloadLanguage(locale);
  } catch (error) {
    console.warn(`Failed to preload language ${locale}:`, error);
  }
};
