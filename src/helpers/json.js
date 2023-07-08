/**
 * Import all json files from a directory
 */
export default function importData(lang = 'en', type = 'online') {
  const context = require.context('../data/', true, /\.json$/);
  const obj = {};
  let setLang = lang;

  const addToObj = (key) => {
    const fileName = key.replace(/^.*([\\/:])/, '').replace('.json', '');
    obj[fileName] = context(key);
  };

  if (context.keys().find((path) => !path.includes(setLang))) {
    setLang = 'en';
  }

  context.keys().forEach((key) => {
    if ([setLang, type, 'data'].every((entry) => key.includes(entry))) {
      // get the filename without the extension nor the path.
      addToObj(key);
    }
  });

  const { poppers, alcohol, ...rest } = obj;

  return { alcohol, poppers, ...rest };
}
