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

const i18n = i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) => 
        import(`./locales/${language}/${namespace}.json`)
    )
  )
  .init(i18nOptions);

export default i18n;
