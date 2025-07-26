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
    label: 'Français',
    voice: 'Google français',
  },
  zh: {
    label: '中文',
    voice: 'Google 中文（中国大陆）',
  },
  hi: {
    label: 'हिन्दी',
    voice: 'Google हिन्दी',
  },
};
