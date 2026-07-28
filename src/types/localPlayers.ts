import { PlayerRole } from './Settings';

/**
 * Player gender options for anatomy placeholder replacement
 * Used to adapt action text to be gender-inclusive
 */
export type PlayerGender = 'male' | 'female' | 'non-binary';

/**
 * Anatomy placeholder tokens supported in action text, replaced based on player
 * gender. Single source of truth: the type, the runtime list, and every token
 * pattern in the replacement pipeline derive from this array, so adding a token
 * here plus a term in each `anatomy.json` is the whole code change.
 */
export const ANATOMY_PLACEHOLDERS = [
  'genital',
  'tip',
  'hole',
  'chest',
  'pronoun_subject',
  'pronoun_object',
  'pronoun_possessive',
  'pronoun_reflexive',
] as const;

export type AnatomyPlaceholder = (typeof ANATOMY_PLACEHOLDERS)[number];

/**
 * Core local player interface for single-device multiplayer
 * Represents a player on the current device
 */
export interface LocalPlayer {
  /** Unique identifier for this local player */
  id: string;
  /** Display name for the player */
  name: string;
  /** Player gender for anatomy placeholder replacement (optional) */
  gender?: PlayerGender;
  /** Player role (sub/dom/vers) */
  role: PlayerRole;
  /** Turn order (0-based index) */
  order: number;
  /** Whether this player is currently active */
  isActive: boolean;
  /** Device identifier (for future multi-device support) */
  deviceId: string;
  /** Current position on the game board (0-based index) */
  location: number;
  /** Whether this player has finished the game */
  isFinished: boolean;
  /** Sound ID for turn notifications (optional) */
  sound?: string;
}

/**
 * Local player session configuration
 * Manages a single-device multiplayer session
 */
export interface LocalPlayerSession {
  /** Unique session identifier */
  id: string;
  /** Room ID this session belongs to */
  roomId: string;
  /** Array of local players in this session */
  players: LocalPlayer[];
  /** Index of currently active player */
  currentPlayerIndex: number;
  /** Whether the session is currently active */
  isActive: boolean;
  /** Session creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
  /** Session settings */
  settings: LocalSessionSettings;
}

/**
 * Settings specific to local player sessions
 * Contains configuration options for single-device gameplay
 */
export interface LocalSessionSettings {
  /** Whether to show turn transitions */
  showTurnTransitions: boolean;
  /** Whether to play sound effects for turns */
  enableTurnSounds: boolean;
  /** Whether to show player avatars */
  showPlayerAvatars: boolean;
}
