/**
 * Import all json files from a directory
 */
export async function importActions(lang = 'en', type = 'online') {
  const obj = {};
  const context = import.meta.glob('../locales/**/*.json');

  for (const key in context) {
    if (key.startsWith(`../locales/${lang}/${type}/`)) {
      const fileName = key.split('/').pop().replace('.json', '');
      obj[fileName] = await context[key]();
    }
  }

  return obj;
}

