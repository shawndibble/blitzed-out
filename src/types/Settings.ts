import { ActionEntry } from './index';

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
  finishRange?: [number, number];
  roomTileCount?: number;
  roomDice?: string;
  readRoll?: boolean;
  displayName?: string;
  room: string;
  roomBackgroundURL?: string;
  customGroups?: Array<{
    groupName: string;
    intensity: number;
  }>;
  selectedActions?: Record<string, ActionEntry>;
  [key: string]: any;
}

export type GameMode = 'solo' | 'online' | 'local';

export type PlayerRole = 'sub' | 'dom' | 'vers';
