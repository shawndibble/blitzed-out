import { Timestamp } from 'firebase/firestore';
import { GameMode } from './customTiles';

export type MessageType = 'chat' | 'actions' | 'settings' | 'room' | 'media';

interface BaseMessage {
  id?: string;
  uid: string;
  text: string;
  displayName: string;
  timestamp: Timestamp;
}

interface ChatMessage extends BaseMessage {
  type: 'chat';
}

interface ActionsMessage extends BaseMessage {
  type: 'actions';
}

interface SettingsMessage extends BaseMessage {
  type: 'settings';
  settings?: string;
  boardSize: number;
  gameBoardId: string;
  gameMode: GameMode;
}

export interface RoomMessage extends BaseMessage {
  type: 'room';
  settings: string;
  boardSize: number;
  gameBoardId: string;
  gameMode: GameMode;
  roomTileCount: number;
}

// Image can be either a string URL or a base64 object
export interface Base64ImageObject {
  base64String: string;
  format: string;
}

export type ImageData = string | Base64ImageObject;

interface MediaMessage extends BaseMessage {
  type: 'media';
  image: ImageData;
}

export type Message = ChatMessage | ActionsMessage | SettingsMessage | RoomMessage | MediaMessage;
