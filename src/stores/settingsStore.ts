import { ActionEntry } from '@/types';
import { Settings } from '@/types/Settings';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { analyticsTracking } from '@/services/analyticsTracking';

const defaultSettings: Settings = {
  locale: 'en',
  gameMode: 'online',
  boardUpdated: false,
  room: 'PUBLIC',
  background: 'color',
  roomBackground: '',
  selectedActions: {},
  hasSeenRollButton: false,
  themeMode: 'system',
  playerDialog: true,
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
        set((state) => {
          const oldSettings = state.settings;
          const newSettings = { ...oldSettings, ...partial };

          // Track setting changes using centralized service
          Object.entries(partial).forEach(([key, newValue]) => {
            const oldValue = oldSettings[key as keyof Settings];
            analyticsTracking.trackSettingsChange(
              key as keyof Settings,
              oldValue,
              newValue,
              newSettings
            );
          });

          return { settings: newSettings };
        }),
      setLocale: (locale) =>
        set((state) => {
          const oldLocale = state.settings.locale;
          analyticsTracking.trackSettingsChange('locale', oldLocale, locale, {
            ...state.settings,
            locale,
          });
          return {
            settings: { ...state.settings, locale },
          };
        }),
      resetSettings: () => set({ settings: defaultSettings }),
      updateSelectedAction: (key, actionEntry) =>
        set((state) => {
          const newSelectedActions = { ...state.settings.selectedActions };
          const isRemoving = actionEntry === null;
          const currentAction = newSelectedActions[key];

          if (isRemoving) {
            analyticsTracking.trackActionChange(currentAction, true);
            delete newSelectedActions[key];
          } else {
            newSelectedActions[key] = actionEntry;
            analyticsTracking.trackActionChange(actionEntry, false);
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
        set((state) => {
          const actionCount = Object.keys(state.settings.selectedActions || {}).length;
          analyticsTracking.trackBulkAction('clear_all_actions', actionCount);
          return {
            settings: { ...state.settings, selectedActions: {} },
          };
        }),
      getSelectedActionsByType: (type: string): Record<string, ActionEntry> => {
        const { selectedActions = {} } = useSettingsStore.getState().settings;
        const actions: Record<string, ActionEntry> = selectedActions || {};
        return Object.entries(actions)
          .filter(([, entry]: [string, ActionEntry]) => entry.type === type)
          .reduce((acc: Record<string, ActionEntry>, [key, entry]: [string, ActionEntry]) => {
            acc[key] = entry;
            return acc;
          }, {});
      },
    }),
    {
      name: 'gameSettings', // localStorage key
      partialize: (state) => ({ settings: state.settings }),
      // Clean up wizard fields on rehydration from localStorage
      onRehydrateStorage: () => (state) => {
        if (state?.settings) {
          // Remove wizard-specific fields that should never persist
          const wizardFields = [
            'localPlayersData',
            'localPlayerSessionSettings',
            'hasLocalPlayers',
          ];

          wizardFields.forEach((field) => {
            if (field in state.settings) {
              delete (state.settings as any)[field];
            }
          });
        }
      },
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
