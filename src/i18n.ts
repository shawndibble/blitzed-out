import i18next, { InitOptions } from 'i18next';

import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';

// Configuration constants
const LANGUAGE_PRELOAD_TIMEOUT = 5000; // 5 second timeout for requestIdleCallback

const i18nOptions: InitOptions = {
  fallbackLng: 'en',
  supportedLngs: ['en', 'es', 'fr', 'zh', 'hi'],
  ns: ['translation', 'errors', 'anatomy'],
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

// Initialize i18n with optimized background loading
i18n
  .init(i18nOptions)
  .then(() => {
    // Defer preloading other languages until after migration is handled
    const scheduleLanguagePreloading = () => {
      const currentLang = i18n.language;
      const commonLangs = ['en', 'es', 'fr'].filter((lang) => lang !== currentLang);

      // Use requestIdleCallback for better performance
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(
          () => {
            commonLangs.forEach((lang) => {
              if (
                i18n?.options?.supportedLngs &&
                Array.isArray(i18n.options.supportedLngs) &&
                i18n.options.supportedLngs.includes(lang)
              ) {
                i18n.loadLanguages(lang).catch(console.warn);
              }
            });
          },
          { timeout: LANGUAGE_PRELOAD_TIMEOUT }
        ); // Timeout for requestIdleCallback
      } else {
        // Fallback with longer delay to allow app to become interactive first
        setTimeout(() => {
          commonLangs.forEach((lang) => {
            if (
              i18n?.options?.supportedLngs &&
              Array.isArray(i18n.options.supportedLngs) &&
              i18n.options.supportedLngs.includes(lang)
            ) {
              i18n.loadLanguages(lang).catch(console.warn);
            }
          });
        }, LANGUAGE_PRELOAD_TIMEOUT); // Load other languages after timeout
      }
    };

    // Delay language preloading to prioritize app startup
    scheduleLanguagePreloading();
  })
  .catch(console.error);

export default i18n;
