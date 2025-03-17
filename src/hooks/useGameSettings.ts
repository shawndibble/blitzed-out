import { useState, useEffect, useCallback } from 'react';

interface GameSettings {
  locale: string;
  gameMode: string;
  [key: string]: any;
}

interface GameSettingsResult {
  settings: GameSettings;
  updateSettings: (newSettings: Partial<GameSettings>) => void;
}

/**
 * Hook to access and monitor game settings from local storage
 * @returns Game settings object and a function to update it
 */
export default function useGameSettings(): GameSettingsResult {
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

  const updateSettings = useCallback((newSettings: Partial<GameSettings>): void => {
    setSettings((prevSettings) => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      try {
        localStorage.setItem('gameSettings', JSON.stringify(updatedSettings));
      } catch (error) {
        console.error('Error saving game settings to localStorage:', error);
      }
      return updatedSettings;
    });
  }, []);

  return { settings, updateSettings };
}
