export const isOffline = (): boolean =>
  typeof navigator !== 'undefined' ? !navigator.onLine : false;
