import { Timestamp } from 'firebase/firestore';
import { GameMode } from './customTiles';

export type MessageType = 'chat' | 'actions' | 'settings' | 'room' | 'media';

interface BaseMessage {
  id?: string;
  uid: string;
  text: string;
  displayName: string;
  timestamp: Timestamp;
  // True for an optimistic message still queued offline / awaiting Firestore confirmation.
  pending?: boolean;
}

interface ChatMessage extends BaseMessage {
  type: 'chat';
}

/**
 * A single dice turn, carried as named fields rather than parsed back out of
 * the display string. `roll` is null for a restart (no dice were rolled).
 * `location` is 0-indexed. `finished` is true whenever the player is sitting
 * on the last tile after this turn (whether they just landed there or were
 * already there and rolled again).
 */
export interface TurnFields {
  kind: 'normal' | 'restart' | 'alreadyFinished';
  roll: number | null;
  location: number;
  title: string;
  description: string;
  finished: boolean;
}

export interface ActionsMessage extends BaseMessage {
  type: 'actions';
  // Optional: absent on messages written before this field shipped — see
  // helpers/actionTurn.ts's decodeLegacyActionText for the back-compat path.
  turn?: TurnFields;
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
  image?: ImageData;
}

export type Message = ChatMessage | ActionsMessage | SettingsMessage | RoomMessage | MediaMessage;

export function isActionsMessage(message: Message): message is ActionsMessage {
  return message.type === 'actions';
}
