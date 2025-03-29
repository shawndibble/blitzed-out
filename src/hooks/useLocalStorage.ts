import { useCallback, useEffect, useState } from 'react';

interface CustomEvent extends Event {
  newValue?: any;
}

function getInitialValue<T>(key: string, defaultVal: T): T {
  const storedValue = localStorage.getItem(key);
  if (!storedValue) {
    return defaultVal;
  }
  try {
    const parsedValue = JSON.parse(storedValue);
    if (typeof defaultVal === 'object' && defaultVal !== null && Object.keys(defaultVal).length) {
      return { ...defaultVal, ...parsedValue } as T;
    }
    return parsedValue as T;
  } catch (error) {
    console.error('Error parsing localStorage value:', error);
    return defaultVal;
  }
}

export default function useLocalStorage<T>(
  localStorageKey: string,
  defaultVal: T = {} as T
): [T, (newValue: T) => void] {
  const eventName = `${localStorageKey}Storage`;

  const [storage, setStorage] = useState<T>(() => getInitialValue<T>(localStorageKey, defaultVal));

  useEffect(() => {
    const listener = (e: CustomEvent): void => {
      if (e.newValue !== undefined) {
        setStorage(e.newValue);
      }
    };
    window.addEventListener(eventName, listener as EventListener);

    return () => window.removeEventListener(eventName, listener as EventListener);
  }, [eventName]);

  const updateLocalStorage = useCallback(
    (newValue: T): void => {
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(newValue));

        const event = new Event(eventName) as CustomEvent;
        event.newValue = newValue;
        window.dispatchEvent(event);
      } catch (error) {
        console.error('Error updating localStorage:', error);
      }
    },
    [localStorageKey, eventName]
  );

  return [storage, updateLocalStorage];
}
