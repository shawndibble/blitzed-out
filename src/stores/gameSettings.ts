import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Settings } from '@/types/Settings';

// Define the game settings store with persistence
export const useGameSettingsStore = create<Settings>()(
  persist(
    () => ({
      boardUpdated: false as boolean,
      roomUpdated: false as boolean,
      playerDialog: true as boolean,
      othersDialog: false as boolean,
      mySound: true as boolean,
      chatSound: true as boolean,
      hideBoardActions: false as boolean,
      locale: 'en',
      gameMode: 'online' as const,
      background: 'color',
      finishRange: [30, 70] as [number, number],
      roomTileCount: 40,
      roomDice: '1d6',
      room: 'PUBLIC',
      roomBackground: 'app' as const,
      backgroundURL: '',
      roomBackgroundURL: '',
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
