function getExtension(filename?: string): string | false {
  const parts = filename?.split('.');
  if (!parts || parts?.length < 2) return false;
  return parts?.[parts.length - 1];
}

function isVideo(file?: string): boolean {
  const bgExtension = getExtension(file);
  return (
    typeof bgExtension === 'string' &&
    ['mp4', 'webm', 'mkv', 'flv', 'avi', 'mov', 'wmv', 'mpg', 'mv4'].includes(bgExtension)
  );
}

export function getURLPath(string?: string): string {
  if (!string) return '';

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
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);

    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // Check for path traversal attempts
    if (parsed.pathname.includes('../') || parsed.pathname.includes('..\\')) {
      return false;
    }

    // Ensure hostname is not empty and doesn't contain suspicious characters
    if (!parsed.hostname || parsed.hostname.includes('..') || parsed.hostname.length < 2) {
      return false;
    }

    // Basic format validation - must have a path or query
    if (parsed.pathname === '/' && !parsed.search && !parsed.hash) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
