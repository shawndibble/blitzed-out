import { useEffect, useState } from 'react';
import { isOffline } from '@/helpers/networkStatus';

/**
 * Tracks browser online/offline state, staying in sync with the
 * `online`/`offline` window events. Returns `true` while online.
 */
export default function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => !isOffline());

  useEffect(() => {
    const updateOnline = () => setOnline(!isOffline());

    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  return online;
}
