/**
 * Import all json files from a directory
 */
export default function importData(lang, type) {
  const context = require.context('../data/', true, /\.json$/);
  const obj = {};

  context.keys().forEach((key) => {
    if ([lang, type, 'data'].every((entry) => key.includes(entry))) {
      // get the filename without the extension
      const fileName = key.replace(/^.*(\\|\/|:)/, '').replace('.json', '');
      obj[fileName] = context(key);
    }
  });

  return obj;
}
