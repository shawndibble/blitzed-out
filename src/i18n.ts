import i18next, { InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import localeService from './services/localeService';

/**
 * Enhanced lazy loading function for additional resources
 * CRITICAL: Only loads resources for the current user's language
 */
const lazyLoadTranslations = (language: string, namespace: string) => {
  const currentLocale = localeService.detectUserLocale();

  console.debug(`i18n requesting: ${language}/${namespace}, current locale: ${currentLocale}`);

  // CRITICAL: Only allow loading for the current user's language
  if (language !== currentLocale) {
    // If the requested language is not the current locale, check if current locale exists
    // If current locale doesn't exist, allow English as fallback
    if (language === 'en' && currentLocale !== 'en') {
      console.debug(`Allowing English fallback for unsupported locale: ${currentLocale}`);
    } else {
      console.debug(`Rejecting load request for non-current language: ${language}`);
      return Promise.reject(new Error(`Only current locale (${currentLocale}) is supported`));
    }
  }

  // For main translation namespace
  if (namespace === 'translation') {
    return import(`./locales/${language}/translation.json`).catch(() => {
      // If current language fails and it's not English, try English
      if (language !== 'en') {
        console.debug(`Fallback to English for missing translation: ${language}`);
        return import(`./locales/en/translation.json`);
      }
      throw new Error(`Translation not found for ${language}`);
    });
  }

  // For game-specific translations (local/online directories)
  const namespaceParts = namespace.split('/');
  if (namespaceParts.length === 2) {
    const [mode, category] = namespaceParts;
    return import(`./locales/${language}/${mode}/${category}.json`).catch(() => {
      // If current language fails and it's not English, try English
      if (language !== 'en') {
        console.debug(
          `Fallback to English for missing game content: ${language}/${mode}/${category}`
        );
        return import(`./locales/en/${mode}/${category}.json`);
      }
      throw new Error(`Game content not found for ${language}/${mode}/${category}`);
    });
  }

  // For other namespaces, try direct import
  return import(`./locales/${language}/${namespace}.json`).catch(() => {
    // If current language fails and it's not English, try English
    if (language !== 'en') {
      console.debug(`Fallback to English for missing namespace: ${language}/${namespace}`);
      return import(`./locales/en/${namespace}.json`);
    }
    throw new Error(`Namespace not found for ${language}/${namespace}`);
  });
};

// Initialize i18next with plugins
const i18n = i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(resourcesToBackend(lazyLoadTranslations));

/**
 * Initialize i18n synchronously with dynamic configuration
 */
const initializeI18n = () => {
  const currentLocale = localeService.detectUserLocale();

  console.debug(`Initializing i18n with locale: ${currentLocale}`);

  // Configure i18n with ONLY the current locale supported initially
  const config: InitOptions = {
    // Only use English as fallback if current locale is not available
    fallbackLng: currentLocale === 'en' ? 'en' : ['en'],
    // CRITICAL: Only include current user locale to prevent loading all languages
    supportedLngs: [currentLocale],
    lng: currentLocale,
    ns: ['translation'],
    defaultNS: 'translation',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // React already safes from XSS
    },
    react: {
      useSuspense: true,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'selectedLanguage',
    },
    // Prevent loading unwanted languages
    load: 'currentOnly',
    preload: false,
  };

  // Initialize synchronously without preloaded resources
  // Resources will be loaded on-demand via resourcesToBackend
  i18n.init(config);
};

// Initialize immediately and synchronously
initializeI18n();

export default i18n;
