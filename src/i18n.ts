import i18next, { InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

const i18nOptions: InitOptions = {
  fallbackLng: 'en',
  supportedLngs: ['en', 'es', 'fr'], // Add all supported languages
  ns: ['translation', 'errors'], // Add namespaces if you have multiple JSON files per language
  defaultNS: 'translation',
  // debug: process.env.NODE_ENV === 'development',
  interpolation: {
    escapeValue: false, // React already safes from XSS
  },
  react: {
    useSuspense: true,
  },
  detection: {
    order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
    caches: ['localStorage', 'cookie'],
  },
};

// Preload only critical translation resources
const preloadCriticalTranslations = async () => {
  const language = localStorage.getItem('i18nextLng') || 'en';

  try {
    // Load only the main translation file initially
    const mainTranslation = await import(`./locales/${language}/translation.json`);

    return {
      [language]: {
        translation: mainTranslation.default || mainTranslation,
      },
    };
  } catch {
    // Fallback to English if language not found
    const enTranslation = await import(`./locales/en/translation.json`);
    return {
      en: {
        translation: enTranslation.default || enTranslation,
      },
    };
  }
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

// Initialize with critical translations preloaded
preloadCriticalTranslations()
  .then((resources) => {
    i18n.init({
      ...i18nOptions,
      resources, // Use preloaded resources
    });
  })
  .catch(() => {
    // Fallback to dynamic loading if preload fails
    i18n.init(i18nOptions);
  });

export default i18n;
