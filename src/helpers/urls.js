function getExtension(filename) {
  const parts = filename?.split('.');
  if (!parts || parts?.length < 2) return false;
  return parts?.[parts.length - 1];
}

function isVideo(file) {
  const bgExtension = getExtension(file);
  return ['mp4', 'webm', 'mkv', 'flv', 'avi', 'mov', 'wmv', 'mpg', 'mv4'].includes(bgExtension);
}

export function getURLPath(string) {
  if (!string) return false;

  if (string?.startsWith('http')) return string;

  if (isVideo(string)) return `/videos/${string}`;

  return `/images/${string}`;
}

export function getSiteName(urlString) {
  return new URL(urlString).hostname
    .replace('www.', '')
    .replace('.com', '')
    .replace('.net', '')
    .replace('.gg', '');
}

export function isValidURL(url) {
  return /^https?:\/\/.+\/.+$/.test(url);
}
