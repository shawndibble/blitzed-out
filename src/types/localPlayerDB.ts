import { LocalPlayerSession } from './localPlayers';

/**
 * Additional statistics data for local players
 * Contains extended metrics and game-specific analytics
 */
export interface LocalPlayerStatsData {
  /** Number of games completed */
  gamesCompleted: number;
  /** Number of games started but not finished */
  gamesAbandoned: number;
  /** Average game completion time in milliseconds */
  averageGameTimeMs?: number;
  /** Longest game session time in milliseconds */
  longestSessionMs?: number;
  /** Total distance moved on game boards */
  totalDistanceMoved: number;
  /** Most common actions taken */
  favoriteActions?: string[];
  /** Win/completion streak */
  currentStreak: number;
  /** Best streak achieved */
  bestStreak: number;
  /** Number of times player finished first in multiplayer */
  firstPlaceFinishes: number;
  /** Additional custom metrics */
  customMetrics?: Record<string, number | string | boolean>;
}

/**
 * Database table structure for local player sessions
 * Extends LocalPlayerSession with database-specific fields
 */
export interface DBLocalPlayerSession extends Omit<LocalPlayerSession, 'id'> {
  /** Auto-generated database ID */
  id?: number;
  /** Session identifier for cross-table relationships */
  sessionId: string;
}

/**
 * Database table structure for individual player moves/actions
 * Tracks actions taken by local players during gameplay
 */
export interface DBLocalPlayerMove {
  /** Auto-generated database ID */
  id?: number;
  /** Session this move belongs to */
  sessionId: string;
  /** Player who made the move */
  playerId: string;
  /** Move/action data */
  moveData: any;
  /** Timestamp when move was made */
  timestamp: number;
  /** Move sequence number within the session */
  sequence: number;
}

/**
 * Database table structure for local player statistics
 * Tracks usage and performance metrics for local players
 */
export interface DBLocalPlayerStats {
  /** Auto-generated database ID */
  id?: number;
  /** Session this stat belongs to */
  sessionId: string;
  /** Player these stats belong to */
  playerId: string;
  /** Total turns taken */
  totalTurns: number;
  /** Total session time in milliseconds */
  totalTimeMs: number;
  /** Last active timestamp */
  lastActive: number;
  /** Additional stats data */
  statsData?: LocalPlayerStatsData;
}
