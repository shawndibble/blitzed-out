import { useEffect, useState } from 'react';

export default function useLocalStorage(localStorageKey, defaultVal = {}) {
  const eventName = `${localStorageKey}Storage`;

  let initialValue = defaultVal;

  if (localStorage.getItem(localStorageKey)) {
    if (typeof defaultVal === 'object' && Object.keys(defaultVal).length) {
      initialValue = { ...defaultVal, ...JSON.parse(localStorage.getItem(localStorageKey)) };
    } else {
      initialValue = JSON.parse(localStorage.getItem(localStorageKey));
    }
  }

  const [storage, setStorage] = useState(initialValue);

  useEffect(() => {
    window.addEventListener(eventName, (e) => setStorage(e.newValue));

    return () => window.removeEventListener(eventName, (e) => setStorage(e.newValue));
    // eslint-disable-next-line
  }, [storage]);

  const updateLocalStorage = (newValue) => {
    localStorage.setItem(localStorageKey, JSON.stringify(newValue));

    const event = new Event(eventName);
    event.newValue = newValue;
    window.dispatchEvent(event);
  };
  return [storage, updateLocalStorage];
}
