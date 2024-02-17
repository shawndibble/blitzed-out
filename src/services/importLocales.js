/**
 * Import all json files from a directory
 */
export function importActions(lang = 'en', type = 'online') {
  const obj = {};

  const context = require.context('../locales/', true, /\.json$/);

  context
    .keys()
    .filter((key) => key.startsWith(`./${lang}/${type}/`))
    .forEach((key) => {
      const fileName = key.split('/').pop().replace('.json', '');
      obj[fileName] = context(key);
    });

  return obj;
}

export function importi18nResources() {
  const obj = {};
  const context = require.context('../locales/', true, /translation\.json$/);

  context.keys().forEach((path) => {
    const pathArray = path.split('/');
    const key = pathArray[pathArray.length - 2];
    obj[key] = { translation: context(path) };
  });

  return obj;
}
