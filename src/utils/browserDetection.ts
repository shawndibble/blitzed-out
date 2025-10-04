export interface BrowserInfo {
  name: string;
  version: number;
  isSupported: boolean;
}

export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent;

  // Safari detection
  const safariMatch = userAgent.match(/Version\/([\d.]+).*Safari/);
  if (safariMatch && !userAgent.includes('Chrome') && !userAgent.includes('Chromium')) {
    const version = parseInt(safariMatch[1].split('.')[0], 10);
    return {
      name: 'Safari',
      version,
      isSupported: version >= 17,
    };
  }

  return {
    name: 'Unknown',
    version: 0,
    isSupported: true,
  };
}

export function isUnsupportedBrowser(): boolean {
  const browser = detectBrowser();
  return !browser.isSupported;
}
