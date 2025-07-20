import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings } from '@/types/Settings';
import { ActionEntry } from '@/types';

const defaultSettings: Settings = {
  locale: 'en',
  gameMode: 'online',
  boardUpdated: false,
  room: 'PUBLIC',
  background: 'color',
  selectedActions: {},
};

interface SettingsStore {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  setLocale: (locale: string) => void;
  resetSettings: () => void;
  updateSelectedAction: (key: string, actionEntry: ActionEntry | null) => void;
  removeSelectedAction: (key: string) => void;
  clearSelectedActions: () => void;
  getSelectedActionsByType: (type: string) => Record<string, ActionEntry>;
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
      updateSelectedAction: (key, actionEntry) =>
        set((state) => {
          const newSelectedActions = { ...state.settings.selectedActions };
          if (actionEntry === null) {
            delete newSelectedActions[key];
          } else {
            newSelectedActions[key] = actionEntry;
          }
          return {
            settings: { ...state.settings, selectedActions: newSelectedActions },
          };
        }),
      removeSelectedAction: (key) =>
        set((state) => {
          const newSelectedActions = { ...state.settings.selectedActions };
          delete newSelectedActions[key];
          return {
            settings: { ...state.settings, selectedActions: newSelectedActions },
          };
        }),
      clearSelectedActions: () =>
        set((state) => ({
          settings: { ...state.settings, selectedActions: {} },
        })),
      getSelectedActionsByType: (type: string): Record<string, ActionEntry> => {
        const { selectedActions = {} } = useSettingsStore.getState().settings;
        const actions: Record<string, ActionEntry> = selectedActions || {};
        return Object.entries(actions)
          .filter(([, entry]: [string, ActionEntry]) => entry.type === type)
          .reduce(
            (acc: Record<string, ActionEntry>, [key, entry]: [string, ActionEntry]) => ({
              ...acc,
              [key]: entry,
            }),
            {}
          );
      },
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
