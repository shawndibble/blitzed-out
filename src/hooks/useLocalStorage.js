import { useState, useEffect } from 'react';

export default function useLocalStorage(localStorageKey, defaultVal = {}) {
  const eventName = `${localStorageKey}Storage`;
  const initialValue = localStorage.getItem(localStorageKey)
    ? JSON.parse(localStorage.getItem(localStorageKey))
    : defaultVal;

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
