import { useState, useEffect } from 'react';

interface GameSettings {
  locale: string;
  gameMode: string;
  [key: string]: any;
}

/**
 * Hook to access and monitor game settings from local storage
 * @returns Game settings object and a function to update it
 */
export default function useGameSettings(): {
  settings: GameSettings;
  updateSettings: (newSettings: Partial<GameSettings>) => void;
} {
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const storedSettings = localStorage.getItem('gameSettings');
      return storedSettings 
        ? { ...{ locale: 'en', gameMode: 'online' }, ...JSON.parse(storedSettings) } 
        : { locale: 'en', gameMode: 'online' };
    } catch (error) {
      console.error('Error parsing game settings from localStorage:', error);
      return { locale: 'en', gameMode: 'online' };
    }
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key === 'gameSettings' && e.newValue) {
        try {
          const newSettings = JSON.parse(e.newValue);
          setSettings(newSettings);
        } catch (error) {
          console.error('Error parsing updated game settings:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateSettings = (newSettings: Partial<GameSettings>): void => {
    const updatedSettings = { ...settings, ...newSettings };
    localStorage.setItem('gameSettings', JSON.stringify(updatedSettings));
    setSettings(updatedSettings);
  };

  return { settings, updateSettings };
}
