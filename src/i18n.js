import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';

i18next.use(initReactI18next)
  .use(resourcesToBackend((language, _) => import(`./locales/${language}/translation.json`)))
  .init({
    fallbackLng: 'en',
  });
