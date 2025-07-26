import i18next, { InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

const i18nOptions: InitOptions = {
  fallbackLng: 'en',
  supportedLngs: ['en', 'es', 'fr', 'zh', 'hi'],
  ns: ['translation', 'errors'],
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
  // Performance optimizations
  load: 'currentOnly', // Only load current language initially
  preload: false, // Don't preload all languages
  cleanCode: true, // Clean language codes
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

// Initialize i18n with background loading
i18n
  .init(i18nOptions)
  .then(() => {
    // Preload common languages in background after initial load
    const currentLang = i18n.language;
    const commonLangs = ['en', 'es', 'fr'].filter((lang) => lang !== currentLang);

    setTimeout(() => {
      commonLangs.forEach((lang) => {
        if (
          i18n.options.supportedLngs &&
          Array.isArray(i18n.options.supportedLngs) &&
          i18n.options.supportedLngs.includes(lang)
        ) {
          i18n.loadLanguages(lang).catch(console.warn);
        }
      });
    }, 2000); // Load other languages after 2 seconds
  })
  .catch(console.error);

export default i18n;
