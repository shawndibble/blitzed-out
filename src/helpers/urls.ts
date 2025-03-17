function getExtension(filename?: string): string | false {
  const parts = filename?.split('.');
  if (!parts || parts?.length < 2) return false;
  return parts?.[parts.length - 1];
}

function isVideo(file?: string): boolean {
  const bgExtension = getExtension(file);
  return typeof bgExtension === 'string' && 
    ['mp4', 'webm', 'mkv', 'flv', 'avi', 'mov', 'wmv', 'mpg', 'mv4'].includes(bgExtension);
}

export function getURLPath(string?: string): string | false {
  if (!string) return false;

  if (string?.startsWith('http')) return string;

  if (isVideo(string)) return `/videos/${string}`;

  return `/images/${string}`;
}

export function getSiteName(urlString: string): string {
  return new URL(urlString).hostname
    .replace('www.', '')
    .replace('.com', '')
    .replace('.net', '')
    .replace('.gg', '');
}

export function isValidURL(url: string): boolean {
  return /^https?:\/\/.+\/.+$/.test(url);
}
