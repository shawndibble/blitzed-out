export interface ActionCard {
  displayName?: string;
  type?: string;
  activity?: string;
}

export interface RoomBackground {
  isVideo: boolean;
  url: string;
}

export interface TurnIndicator {
  displayName: string;
  [key: string]: any;
}
