import { ActionEntry } from './index';
import { LocalSessionSettings } from './localPlayers';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Settings {
  advancedSettings?: boolean;
  gameMode: GameMode;
  roomRealtime?: boolean;
  role?: PlayerRole;
  boardUpdated: boolean;
  roomUpdated?: boolean;
  playerDialog?: boolean;
  othersDialog?: boolean;
  mySound?: boolean;
  otherSound?: boolean;
  chatSound?: boolean;
  hideBoardActions?: boolean;
  locale?: string;
  background?: string;
  roomBackground?: string;
  /** Theme preference: 'light', 'dark', or 'system' (follows OS preference) */
  themeMode?: ThemeMode;
  finishRange?: [number, number];
  roomTileCount?: number;
  roomDice?: string;
  readRoll?: boolean;
  voicePreference?: string;
  displayName?: string;
  room: string;
  roomBackgroundURL?: string;
  customGroups?: Array<{
    groupName: string;
    intensity: number;
  }>;
  selectedActions?: Record<string, ActionEntry>;
  hasSeenRollButton?: boolean;
  /** Local player settings for single-device multiplayer (optional) */
  localPlayers?: LocalSessionSettings;
  [key: string]: any;
}

export type GameMode = 'solo' | 'online' | 'local';

export type PlayerRole = 'sub' | 'dom' | 'vers';
