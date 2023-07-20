/**
 * Import all json files from a directory
 */
export function importActions(lang = 'en', type = 'online') {
  const obj = {};
  let setLang = lang;
  const context = require.context('../locales/', true, /\.json$/);

  const addToObj = (key) => {
    const fileName = key.replace(/^.*([\\/:])/, '').replace('.json', '');
    obj[fileName] = context(key);
  };

  if (!context.keys().find((path) => path.includes(setLang))) {
    setLang = 'en';
  }

  context.keys().forEach((key) => {
    if (key.startsWith(`locales/${setLang}/${type}/`)) {
      // get the filename without the extension nor the path.
      addToObj(key);
    }
  });

  const { poppers, alcohol, ...rest } = obj;

  return { alcohol, poppers, ...rest };
}

export function importi18nResources() {
  const obj = {};
  const context = require.context('../locales/', true, /translation\.json$/);

  const addToObj = (path) => {
    const pathArray = path.split('/');
    const key = pathArray[pathArray.length - 2];
    obj[key] = { translation: context(path) };
  };

  context.keys().forEach((path) => addToObj(path));

  return obj;
}
