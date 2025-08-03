import { LocalPlayer } from './localPlayers';
import { User } from './index';

/**
 * Represents a remote player (existing functionality)
 * This is the standard user from the online multiplayer system
 */
export interface RemotePlayer extends User {
  /** Player type identifier */
  type: 'remote';
  /** Online status */
  isOnline?: boolean;
  /** Last seen timestamp */
  lastSeen?: number;
}

/**
 * Extended local player with type discrimination
 * Adds type field for union type discrimination
 */
export interface HybridLocalPlayer extends LocalPlayer {
  /** Player type identifier */
  type: 'local';
}

/**
 * Union type for all player types in the system
 * Supports both local (single-device) and remote (multi-device) players
 */
export type HybridPlayer = HybridLocalPlayer | RemotePlayer;

/**
 * Player list that can contain both local and remote players
 * Used in components that need to display mixed player types
 */
export interface HybridPlayerList {
  /** Local players on this device */
  localPlayers: HybridLocalPlayer[];
  /** Remote players from other devices */
  remotePlayers: RemotePlayer[];
  /** Combined list for display purposes */
  allPlayers: HybridPlayer[];
}

/**
 * Type guard to check if a player is local
 */
export function isLocalPlayer(player: HybridPlayer): player is HybridLocalPlayer {
  return player.type === 'local';
}

/**
 * Type guard to check if a player is remote
 */
export function isRemotePlayer(player: HybridPlayer): player is RemotePlayer {
  return player.type === 'remote';
}

/**
 * Helper to convert LocalPlayer to HybridLocalPlayer
 */
export function toHybridLocalPlayer(localPlayer: LocalPlayer): HybridLocalPlayer {
  return {
    ...localPlayer,
    type: 'local',
  };
}

/**
 * Helper to convert User to RemotePlayer
 */
export function toRemotePlayer(user: User): RemotePlayer {
  return {
    ...user,
    type: 'remote',
  };
}
