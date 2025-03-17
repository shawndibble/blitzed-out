import english from '../locales/en/translation.json';
import spanish from '../locales/es/translation.json';
import french from '../locales/fr/translation.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      english: typeof english;
      spanish: typeof spanish;
      french: typeof french;
    };
  }
}
