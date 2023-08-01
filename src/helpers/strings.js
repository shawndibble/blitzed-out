export function camelToPascal(text) {
  const word = text?.replace(/([A-Z])/g, ' $1').trim();
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function pascalToCamel(text) {
  return text.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
    if (+match === 0) return ''; // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

export function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export function extractAction(message) {
  const textLines = message?.split(/\r?\n/) || [];
  return textLines[textLines.length - 1]?.split(':')[1];
}

export function getExtention(filename) {
  const parts = filename?.split('.');
  if (!parts || parts?.length < 2) return false;
  return parts?.[parts.length - 1];
}

export function isVideo(file) {
  const bgExtension = getExtention(file);
  return ['mp4', 'webm', 'mkv', 'flv', 'avi', 'mov', 'wmv', 'mpg', 'mv4'].includes(bgExtension);
}

export function getURLPath(string) {
  if (string.startsWith('http')) {
    return string;
  }

  if (isVideo(string)) {
    return `/videos/${string}`;
  }

  return `/images/${string}`;
}
