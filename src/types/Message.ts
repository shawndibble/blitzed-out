import { Timestamp } from 'firebase/firestore';

export type MessageType = 'chat' | 'actions' | 'settings' | 'room' | 'media';

interface BaseMessage {
  id?: string;
  uid: string;
  text: string;
  displayName: string;
  timestamp: Timestamp;
  [key: string]: any;
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
}

interface RoomMessage extends BaseMessage {
  type: 'room';
  settings: string;
  boardSize: number;
  gameBoardId: string;
  gameMode: 'online' | 'solo';
}

interface MediaMessage extends BaseMessage {
  type: 'media';
  image: string;
}

export type Message = ChatMessage | ActionsMessage | SettingsMessage | RoomMessage | MediaMessage;
