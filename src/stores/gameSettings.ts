import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Settings } from '@/types/Settings';

// Define the game settings store with persistence
export const useGameSettingsStore = create<Settings>()(
  persist(
    (set) => ({
      boardUpdated: false,
      roomUpdated: false,
      playerDialog: true,
      othersDialog: false,
      mySound: true,
      chatSound: true,
      hideBoardActions: false,
      locale: 'en',
      gameMode: 'online',
      background: 'color',
      finishRange: [30, 70],
      roomTileCount: 40,
      roomDice: '1d6',
      room: 'PUBLIC',
    }),
    {
      name: 'gameSettings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Helper functions to update settings
export const updateGameSettings = (newSettings: Partial<Settings>) => {
  useGameSettingsStore.setState((state: Settings) => ({
    ...state,
    ...newSettings,
  }));
};

// Helper function to get current settings
export const getGameSettings = (): Settings => {
  return useGameSettingsStore.getState();
};
