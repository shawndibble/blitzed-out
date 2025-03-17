export interface Settings {
  gameMode: GameMode;
  roomRealtime?: boolean;
  actions?: Array<string>; // depricated
  consumption?: Array<string>; //depricated
  role?: 'sub' | 'dom' | 'vers';
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
  finishRange?: Array<number>;
  roomTileCount?: number;
  roomDice?: string;
  readRoll?: boolean;
  displayName?: string;
  room?: string;
  roomBackgroundURL?: string;
  [key: string]: any;
}

export type GameMode = 'solo' | 'online';
