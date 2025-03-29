export interface Settings {
  gameMode: GameMode;
  roomRealtime?: boolean;
  actions?: Array<string>; // depricated
  consumption?: Array<string>; //depricated
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
  [key: string]: any;
}

export type GameMode = 'solo' | 'online' | 'local';

export type PlayerRole = 'sub' | 'dom' | 'vers';
