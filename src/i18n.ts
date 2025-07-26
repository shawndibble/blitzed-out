import i18next, { InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

const i18nOptions: InitOptions = {
  fallbackLng: 'en',
  supportedLngs: ['en', 'es', 'fr', 'zh', 'hi'], // Add all supported languages
  ns: ['translation', 'errors'], // Add namespaces if you have multiple JSON files per language
  defaultNS: 'translation',
  // debug: process.env.NODE_ENV === 'development',
  interpolation: {
    escapeValue: false, // React already safes from XSS
  },
  react: {
    useSuspense: false, // Disable suspense to prevent issues with language switching
  },
  detection: {
    order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
    caches: ['localStorage', 'cookie'],
  },
};

// Lazy loading function for additional resources
const lazyLoadTranslations = (language: string, namespace: string) => {
  // Only load specific locale files when actually needed
  if (namespace === 'translation') {
    return import(`./locales/${language}/translation.json`);
  }

  // For game-specific translations, load them on-demand
  return import(`./locales/${language}/${namespace}.json`).catch(() => {
    // Fallback to English if translation doesn't exist
    return import(`./locales/en/${namespace}.json`);
  });
};

const i18n = i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(resourcesToBackend(lazyLoadTranslations));

// Initialize i18n synchronously for immediate availability
i18n.init(i18nOptions);

export default i18n;
