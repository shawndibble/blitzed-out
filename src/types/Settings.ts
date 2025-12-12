import { ActionEntry } from './index';
import { LocalSessionSettings, PlayerGender } from './localPlayers';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Settings {
  gameMode: GameMode;
  roomRealtime?: boolean;
  role?: PlayerRole;
  gender?: PlayerGender;
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
  voicePitch?: number;
  displayName?: string;
  room: string;
  roomBackgroundURL?: string;
  customGroups?: Array<{
    groupName: string;
    intensity: number;
  }>;
  selectedActions?: Record<string, ActionEntry>;
  hasSeenRollButton?: boolean;
  /** Show 3D dice animation when rolling */
  showDiceAnimation?: boolean;
  /** Local player settings for single-device multiplayer (optional) */
  localPlayers?: LocalSessionSettings;
  [key: string]: any;
}

export type GameMode = 'solo' | 'online' | 'local';

export type PlayerRole = 'sub' | 'dom' | 'vers';
