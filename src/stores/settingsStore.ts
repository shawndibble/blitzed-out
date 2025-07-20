import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings } from '@/types/Settings';

const defaultSettings: Settings = {
  locale: 'en',
  gameMode: 'online',
  boardUpdated: false,
  room: 'PUBLIC',
  background: 'color',
};

interface SettingsStore {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  setLocale: (locale: string) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),
      setLocale: (locale) =>
        set((state) => ({
          settings: { ...state.settings, locale },
        })),
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'gameSettings', // localStorage key
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);

// Compatibility hook for useLocalStorage('gameSettings') pattern
export const useSettings = (): [Settings, (partial: Partial<Settings>) => void] => {
  const { settings, updateSettings } = useSettingsStore();
  return [settings, updateSettings];
};

// Compatibility hook for useGameSettings() pattern
export const useGameSettings = () => {
  const { settings, updateSettings } = useSettingsStore();
  return { settings, updateSettings };
};
