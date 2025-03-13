import { useState, useEffect } from 'react';

/**
 * Hook to access and monitor game settings from local storage
 * @returns {Object} Game settings object and a function to update it
 */
export default function useGameSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const storedSettings = localStorage.getItem('gameSettings');
      return storedSettings ? JSON.parse(storedSettings) : { locale: 'en', gameMode: 'online' };
    } catch (error) {
      console.error('Error parsing game settings from localStorage:', error);
      return { locale: 'en', gameMode: 'online' };
    }
  });

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'gameSettings') {
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

  const updateSettings = (newSettings) => {
    const updatedSettings = { ...settings, ...newSettings };
    localStorage.setItem('gameSettings', JSON.stringify(updatedSettings));
    setSettings(updatedSettings);
  };

  return { settings, updateSettings };
}
