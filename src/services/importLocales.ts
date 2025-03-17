import languagesData from '../locales/languages.json';

interface ActionModule {
  actions: {
    [key: string]: string[];
  };
  default: {
    actions: {
      [key: string]: string[];
    };
  };
  label: string;
  type: string;
}

interface ActionObject {
  [key: string]: ActionModule;
}

export interface LanguageConfig {
  label: string;
  voice: string;
}

export async function importActions(lang = 'en', type = 'online'): Promise<ActionObject> {
  const obj: ActionObject = {};
  const context = import.meta.glob('../locales/**/*.json');

  for (const key in context) {
    if (key.startsWith(`../locales/${lang}/${type}/`)) {
      const fileName = key.split('/').pop()?.replace('.json', '') || '';
      if (fileName) {
        obj[fileName] = await context[key]();
      }
    }
  }

  return obj;
}

export const languages: { [key: string]: LanguageConfig } = languagesData;
