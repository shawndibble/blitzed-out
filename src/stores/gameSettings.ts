import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { useMemo } from 'react';

// Define types
export type GameMode = 'solo' | 'online' | 'local';

export interface Settings {
  boardUpdated: boolean;
  roomUpdated: boolean;
  playerDialog: boolean;
  othersDialog: boolean;
  mySound: boolean;
  chatSound: boolean;
  otherSound: boolean;
  readRoll: boolean;
  hideBoardActions: boolean;
  gameMode: GameMode;
  locale: string;
  room: string;
  roomTileCount: number;
  roomDice: string;
  finishRange: [number, number];
  background: string;
  roomBackground: string;
  backgroundURL: string;
  roomBackgroundURL: string;
  advancedSettings: boolean;
}

// Default settings
const defaultSettings: Settings = {
  boardUpdated: false,
  roomUpdated: false,
  playerDialog: true,
  othersDialog: false,
  mySound: true,
  chatSound: true,
  otherSound: false,
  readRoll: false,
  hideBoardActions: false,
  gameMode: 'online',
  locale: 'en',
  room: 'PUBLIC',
  roomTileCount: 40,
  roomDice: '1d6',
  finishRange: [30, 70],
  background: 'color',
  roomBackground: 'app',
  backgroundURL: '',
  roomBackgroundURL: '',
  advancedSettings: false,
};

// Define the game settings store with persistence and devtools
export const useGameSettingsStore = create<Settings & { 
  updateSettings: (newSettings: Partial<Settings>) => void; 
  resetSettings: () => void; 
  toggleDialog: (dialogType: 'playerDialog' | 'othersDialog') => void; 
  toggleSound: (soundType: 'mySound' | 'chatSound' | 'otherSound' | 'readRoll') => void; 
}>()(
  devtools(
    persist(
      (set) => ({
        ...defaultSettings,
        updateSettings: (newSettings: Partial<Settings>) => set((state) => ({ ...state, ...newSettings })),
        resetSettings: () => set(defaultSettings),
        toggleDialog: (dialogType: 'playerDialog' | 'othersDialog') =>
          set((state) => ({ ...state, [dialogType]: !state[dialogType] })),
        toggleSound: (soundType: 'mySound' | 'chatSound' | 'otherSound' | 'readRoll') =>
          set((state) => ({ ...state, [soundType]: !state[soundType] })),
      }),
      {
        name: 'game-settings',
      }
    ),
    {
      enabled: process.env.NODE_ENV === 'development',
      name: 'GameSettingsStore',
    }
  )
);

// Optimized selectors with memoization to prevent infinite loops
export const useDialogSettings = (): { playerDialog: boolean; othersDialog: boolean } => {
  const playerDialog = useGameSettingsStore((state) => state.playerDialog);
  const othersDialog = useGameSettingsStore((state) => state.othersDialog);
  
  return useMemo(() => ({
    playerDialog,
    othersDialog,
  }), [playerDialog, othersDialog]);
};

export const useSoundSettings = (): { mySound: boolean; chatSound: boolean } => {
  const mySound = useGameSettingsStore((state) => state.mySound);
  const chatSound = useGameSettingsStore((state) => state.chatSound);
  
  return useMemo(() => ({
    mySound,
    chatSound,
  }), [mySound, chatSound]);
};

export const useSoundAndDialogSettings = (): {
  mySound: boolean;
  otherSound: boolean;
  chatSound: boolean;
  readRoll: boolean;
  playerDialog: boolean;
  othersDialog: boolean;
} => {
  const mySound = useGameSettingsStore((state) => state.mySound);
  const otherSound = useGameSettingsStore((state) => state.otherSound);
  const chatSound = useGameSettingsStore((state) => state.chatSound);
  const readRoll = useGameSettingsStore((state) => state.readRoll);
  const playerDialog = useGameSettingsStore((state) => state.playerDialog);
  const othersDialog = useGameSettingsStore((state) => state.othersDialog);
  
  return useMemo(() => ({
    mySound,
    otherSound,
    chatSound,
    readRoll,
    playerDialog,
    othersDialog,
  }), [mySound, otherSound, chatSound, readRoll, playerDialog, othersDialog]);
};

export const useGameModeSettings = (): { gameMode: GameMode; locale: string } => {
  const gameMode = useGameSettingsStore((state) => state.gameMode);
  const locale = useGameSettingsStore((state) => state.locale);
  
  return useMemo(() => ({
    gameMode,
    locale,
  }), [gameMode, locale]);
};

export const useRoomSettings = (): {
  room: string;
  roomTileCount: number;
  roomDice: string;
  roomBackground: string;
  roomBackgroundURL: string;
} => {
  const room = useGameSettingsStore((state) => state.room);
  const roomTileCount = useGameSettingsStore((state) => state.roomTileCount);
  const roomDice = useGameSettingsStore((state) => state.roomDice);
  const roomBackground = useGameSettingsStore((state) => state.roomBackground);
  const roomBackgroundURL = useGameSettingsStore((state) => state.roomBackgroundURL);
  
  return useMemo(() => ({
    room,
    roomTileCount,
    roomDice,
    roomBackground,
    roomBackgroundURL,
  }), [room, roomTileCount, roomDice, roomBackground, roomBackgroundURL]);
};

export const useBackgroundSettings = (): {
  background: string;
  backgroundURL: string;
  roomBackground: string;
  roomBackgroundURL: string;
} => {
  const background = useGameSettingsStore((state) => state.background);
  const backgroundURL = useGameSettingsStore((state) => state.backgroundURL);
  const roomBackground = useGameSettingsStore((state) => state.roomBackground);
  const roomBackgroundURL = useGameSettingsStore((state) => state.roomBackgroundURL);
  
  return useMemo(() => ({
    background,
    backgroundURL,
    roomBackground,
    roomBackgroundURL,
  }), [background, backgroundURL, roomBackground, roomBackgroundURL]);
};

export const useBoardSettings = (): { 
  gameMode: GameMode; 
  roomTileCount: number; 
  finishRange: [number, number];
  room: string;
  boardUpdated: boolean;
  roomUpdated: boolean;
} => {
  const gameMode = useGameSettingsStore((state) => state.gameMode);
  const roomTileCount = useGameSettingsStore((state) => state.roomTileCount);
  const finishRange = useGameSettingsStore((state) => state.finishRange);
  const room = useGameSettingsStore((state) => state.room);
  const boardUpdated = useGameSettingsStore((state) => state.boardUpdated);
  const roomUpdated = useGameSettingsStore((state) => state.roomUpdated);
  
  return useMemo(() => ({
    gameMode,
    roomTileCount,
    finishRange,
    room,
    boardUpdated,
    roomUpdated,
  }), [gameMode, roomTileCount, finishRange, room, boardUpdated, roomUpdated]);
};

export const useMenuSettings = (): { room: string; gameMode: GameMode; advancedSettings: boolean } => {
  const room = useGameSettingsStore((state) => state.room);
  const gameMode = useGameSettingsStore((state) => state.gameMode);
  const advancedSettings = useGameSettingsStore((state) => state.advancedSettings);
  
  return useMemo(() => ({
    room,
    gameMode,
    advancedSettings,
  }), [room, gameMode, advancedSettings]);
};

export const useRoomPageSettings = (): {
  gameMode: GameMode;
  room: string;
  boardUpdated: boolean;
  roomUpdated: boolean;
  finishRange: [number, number];
  roomTileCount: number;
  background: string;
  roomBackground: string;
  backgroundURL: string;
  roomBackgroundURL: string;
} => {
  const gameMode = useGameSettingsStore((state) => state.gameMode);
  const room = useGameSettingsStore((state) => state.room);
  const boardUpdated = useGameSettingsStore((state) => state.boardUpdated);
  const roomUpdated = useGameSettingsStore((state) => state.roomUpdated);
  const finishRange = useGameSettingsStore((state) => state.finishRange);
  const roomTileCount = useGameSettingsStore((state) => state.roomTileCount);
  const background = useGameSettingsStore((state) => state.background);
  const roomBackground = useGameSettingsStore((state) => state.roomBackground);
  const backgroundURL = useGameSettingsStore((state) => state.backgroundURL);
  const roomBackgroundURL = useGameSettingsStore((state) => state.roomBackgroundURL);
  
  return useMemo(() => ({
    gameMode,
    room,
    boardUpdated,
    roomUpdated,
    finishRange,
    roomTileCount,
    background,
    roomBackground,
    backgroundURL,
    roomBackgroundURL,
  }), [gameMode, room, boardUpdated, roomUpdated, finishRange, roomTileCount, background, roomBackground, backgroundURL, roomBackgroundURL]);
};

export const useGameOverSettings = (): {
  room: string;
  gameMode: GameMode;
  boardUpdated: boolean;
} => {
  const room = useGameSettingsStore((state) => state.room);
  const gameMode = useGameSettingsStore((state) => state.gameMode);
  const boardUpdated = useGameSettingsStore((state) => state.boardUpdated);
  
  return useMemo(() => ({
    room,
    gameMode,
    boardUpdated,
  }), [room, gameMode, boardUpdated]);
};

// Legacy helper functions for backward compatibility
export const updateGameSettings = (newSettings: Partial<Settings>) => {
  useGameSettingsStore.getState().updateSettings(newSettings);
};

export const getGameSettings = (): Settings => {
  const state = useGameSettingsStore.getState();
  const { updateSettings, resetSettings, toggleDialog, toggleSound, ...settings } = state;
  return settings;
};

// Individual selectors for primitive values (no memoization needed)
export const useGameMode = () => useGameSettingsStore((state) => state.gameMode);
export const useLocale = () => useGameSettingsStore((state) => state.locale);
export const useBoardUpdated = () => useGameSettingsStore((state) => state.boardUpdated);
export const useRoomUpdated = () => useGameSettingsStore((state) => state.roomUpdated);
export const usePlayerDialog = () => useGameSettingsStore((state) => state.playerDialog);
export const useOthersDialog = () => useGameSettingsStore((state) => state.othersDialog);
export const useMySound = () => useGameSettingsStore((state) => state.mySound);
export const useChatSound = () => useGameSettingsStore((state) => state.chatSound);
