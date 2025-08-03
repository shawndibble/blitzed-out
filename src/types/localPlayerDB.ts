import { LocalPlayerSession } from './localPlayers';

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
  statsData?: any;
}
