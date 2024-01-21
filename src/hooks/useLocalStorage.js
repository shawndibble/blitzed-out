import { useCallback, useEffect, useMemo, useState } from 'react';

function getInitialValue(key, defaultVal) {
  const storedValue = localStorage.getItem(key);
  if (!storedValue) {
    return defaultVal;
  }
  const parsedValue = JSON.parse(storedValue);
  if (typeof defaultVal === 'object' && Object.keys(defaultVal).length) {
    return { ...defaultVal, ...parsedValue };
  }
  return parsedValue;
}

export default function useLocalStorage(localStorageKey, defaultVal = {}) {
  const eventName = `${localStorageKey}Storage`;

  const [storage, setStorage] = useState(() =>
    getInitialValue(localStorageKey, defaultVal)
  );

  useEffect(() => {
    const listener = (e) => setStorage(e.newValue);
    window.addEventListener(eventName, listener);

    return () => window.removeEventListener(eventName, listener);
  }, [eventName]);

  const updateLocalStorage = useCallback(
    (newValue) => {
      localStorage.setItem(localStorageKey, JSON.stringify(newValue));

      const event = new Event(eventName);
      event.newValue = newValue;
      window.dispatchEvent(event);
    },
    [localStorageKey, eventName]
  );

  return [useMemo(() => storage, [storage]), updateLocalStorage];
}
