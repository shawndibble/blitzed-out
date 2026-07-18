import { ActionEntry } from './index';
import { LocalSessionSettings, PlayerGender } from './localPlayers';

export type ThemeMode = 'light' | 'dark' | 'system';

/** Cadence presets for Hands-Free play (see CONTEXT.md "Hands-Free"). */
export type HandsFreePreset = 'quick' | 'standard' | 'extended';

export type AmbientSoundscape = 'lounge' | 'intimate' | 'party';

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
  hapticFeedback?: boolean;
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
  /** Enable ambient background music */
  ambientMusicEnabled?: boolean;
  /** Selected ambient soundscape */
  ambientSoundscape?: AmbientSoundscape;
  /** Ambient music volume (0-1) */
  ambientVolume?: number;
  /** Enable wake lock to prevent screen sleep during gameplay (default: true) */
  wakeLockEnabled?: boolean;
  /** True = solo-sexual (solo actions only); false = group play (foreplay/sex actions). Applies to online mode only. */
  soloPlay?: boolean;
  /** Hands-Free play: auto-roll + spoken actions. Solo and Shared Device only. */
  handsFree?: boolean;
  /** Hands-Free roll cadence preset */
  handsFreePreset?: HandsFreePreset;
  [key: string]: any;
}

export type GameMode = 'solo' | 'online' | 'local';

/**
 * The two content sets that action groups, bundles, custom tiles, and packs
 * exist for. `solo` topology reuses `online` content — see CONTEXT.md
 * "Three topologies, two content sets". Derive via `deriveContentMode`
 * (settingsStore); never widen this back to GameMode.
 */
export type ContentGameMode = 'online' | 'local';

export type PlayerRole = 'sub' | 'dom' | 'vers';
