/**
 * i18n Helper utilities and constants
 */

// Supported languages with their display labels and voice settings
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
