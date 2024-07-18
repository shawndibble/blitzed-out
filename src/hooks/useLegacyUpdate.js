// When called, will import the data pulled from useLocalStorage('customTiles') into the Dexie database as defined in stores/customTiles.js. Then will delete the data in localstorage.

import { useEffect } from 'react';
import { importCustomTiles } from 'stores/customTiles';

export default function useLegacyUpdate() {
  useEffect(() => {
    const legacyData = localStorage.getItem('customTiles');
    if (legacyData?.length) {
      localStorage.removeItem('customTiles');
      const records = JSON.parse(legacyData);
      importCustomTiles(records);
    }
  }, []);
}
