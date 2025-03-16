export interface ActionCard {
  displayName?: string;
  type?: string;
  activity?: string;
}

export interface RoomBackground {
  isVideo: boolean;
  url: string;
}

export interface Message {
  id?: string;
  type: string;
  text?: string;
  displayName?: string;
  settings?: string;
  [key: string]: any;
}

export interface TurnIndicator {
  displayName: string;
  [key: string]: any;
}
