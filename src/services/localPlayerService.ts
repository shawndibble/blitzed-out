import { nanoid } from 'nanoid';
import db from '@/stores/store';
import type {
  LocalPlayer,
  LocalPlayerSession,
  LocalSessionSettings,
  DBLocalPlayerSession,
} from '@/types';

/**
 * Service for managing local player sessions in single-device multiplayer mode
 * Handles session creation, player management, and turn advancement
 */
export class LocalPlayerService {
  private static instance: LocalPlayerService;
  private currentSession: LocalPlayerSession | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance of LocalPlayerService
   */
  public static getInstance(): LocalPlayerService {
    if (!LocalPlayerService.instance) {
      LocalPlayerService.instance = new LocalPlayerService();
    }
    return LocalPlayerService.instance;
  }

  /**
   * Create a new local player session
   * @param roomId - The room ID this session belongs to
   * @param players - Array of local players
   * @param settings - Session settings
   * @returns Promise<LocalPlayerSession> - The created session
   */
  public async createSession(
    roomId: string,
    players: LocalPlayer[],
    settings: LocalSessionSettings
  ): Promise<LocalPlayerSession> {
    try {
      // Validate input
      this.validateSessionInput(roomId, players, settings);

      const sessionId = nanoid();
      const now = Date.now();

      // Initialize players with starting positions
      const initializedPlayers = players.map((player) => ({
        ...player,
        location: player.location ?? 0, // Start at position 0 if not specified
        isFinished: player.isFinished ?? false, // Not finished by default
      }));

      const session: LocalPlayerSession = {
        id: sessionId,
        roomId,
        players: initializedPlayers,
        currentPlayerIndex: 0,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        settings: { ...settings },
      };

      // Prepare database entry
      const dbSession: DBLocalPlayerSession = {
        sessionId: session.id,
        roomId: session.roomId,
        players: session.players,
        currentPlayerIndex: session.currentPlayerIndex,
        isActive: session.isActive,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        settings: session.settings,
      };

      // Save to database
      await db.localPlayerSessions.add(dbSession);

      // Set as current session
      this.currentSession = session;

      return session;
    } catch (error) {
      throw new Error(
        `Failed to create local player session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get an existing local player session by ID
   * @param sessionId - The session ID to retrieve
   * @returns Promise<LocalPlayerSession | null> - The session or null if not found
   */
  public async getSession(sessionId: string): Promise<LocalPlayerSession | null> {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      const dbSession = await db.localPlayerSessions.where('sessionId').equals(sessionId).first();

      if (!dbSession) {
        return null;
      }

      return this.convertDbSessionToSession(dbSession);
    } catch (error) {
      throw new Error(
        `Failed to get session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update an existing local player session
   * @param sessionId - The session ID to update
   * @param updates - Partial session data to update
   * @returns Promise<LocalPlayerSession> - The updated session
   */
  public async updateSession(
    sessionId: string,
    updates: Partial<Omit<LocalPlayerSession, 'id' | 'createdAt'>>
  ): Promise<LocalPlayerSession> {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      const existingSession = await this.getSession(sessionId);
      if (!existingSession) {
        throw new Error('Session not found');
      }

      const updatedSession: LocalPlayerSession = {
        ...existingSession,
        ...updates,
        id: sessionId, // Ensure ID cannot be changed
        createdAt: existingSession.createdAt, // Ensure createdAt cannot be changed
        updatedAt: Date.now(),
      };

      // Prepare database update
      const dbUpdate: Partial<DBLocalPlayerSession> = {
        roomId: updatedSession.roomId,
        players: updatedSession.players,
        currentPlayerIndex: updatedSession.currentPlayerIndex,
        isActive: updatedSession.isActive,
        updatedAt: updatedSession.updatedAt,
        settings: updatedSession.settings,
      };

      // Update in database
      await db.localPlayerSessions.where('sessionId').equals(sessionId).modify(dbUpdate);

      // Update current session if it's the same
      if (this.currentSession?.id === sessionId) {
        this.currentSession = updatedSession;
      }

      return updatedSession;
    } catch (error) {
      throw new Error(
        `Failed to update session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Advance to the next local player in turn order
   * @param sessionId - The session ID to advance turn for
   * @returns Promise<LocalPlayer> - The next active player
   */
  public async advanceLocalTurn(sessionId: string): Promise<LocalPlayer> {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (!session.isActive) {
        throw new Error('Cannot advance turn on inactive session');
      }

      if (session.players.length === 0) {
        throw new Error('No players in session');
      }

      // Calculate next player index (wrap around)
      const nextIndex = (session.currentPlayerIndex + 1) % session.players.length;

      // Update current player active states
      const updatedPlayers = session.players.map((player, index) => ({
        ...player,
        isActive: index === nextIndex,
      }));

      // Update session
      const updatedSession = await this.updateSession(sessionId, {
        players: updatedPlayers,
        currentPlayerIndex: nextIndex,
      });

      return updatedSession.players[nextIndex];
    } catch (error) {
      throw new Error(
        `Failed to advance turn: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get the current active session
   * @returns LocalPlayerSession | null - The current session or null
   */
  public getCurrentSession(): LocalPlayerSession | null {
    return this.currentSession;
  }

  /**
   * Update a specific local player's position on the game board
   * @param sessionId - The session ID containing the player
   * @param playerId - The local player ID to update
   * @param newLocation - New board position (0-based index)
   * @param isFinished - Whether the player has finished the game
   * @returns Promise<LocalPlayer> - The updated player
   */
  public async updatePlayerPosition(
    sessionId: string,
    playerId: string,
    newLocation: number,
    isFinished: boolean = false
  ): Promise<LocalPlayer> {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }
      if (!playerId) {
        throw new Error('Player ID is required');
      }
      if (newLocation < 0) {
        throw new Error('Location must be non-negative');
      }

      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      if (!session.isActive) {
        throw new Error('Cannot update player position on inactive session');
      }

      // Find and update the specific player
      const playerIndex = session.players.findIndex((p) => p.id === playerId);
      if (playerIndex === -1) {
        throw new Error(`Player with ID ${playerId} not found in session`);
      }

      const updatedPlayers = [...session.players];
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        location: newLocation,
        isFinished,
      };

      // Update session
      await this.updateSession(sessionId, {
        players: updatedPlayers,
      });

      return updatedPlayers[playerIndex];
    } catch (error) {
      throw new Error(
        `Failed to update player position: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Clear the current session (does not delete from database)
   */
  public clearCurrentSession(): void {
    this.currentSession = null;
  }

  /**
   * Validate session input parameters
   * @private
   */
  private validateSessionInput(
    roomId: string,
    players: LocalPlayer[],
    settings: LocalSessionSettings
  ): void {
    if (!roomId || typeof roomId !== 'string') {
      throw new Error('Valid room ID is required');
    }

    if (!Array.isArray(players) || players.length < 2 || players.length > 4) {
      throw new Error('Session must have between 2 and 4 players');
    }

    // Validate each player
    players.forEach((player, index) => {
      if (!player.id || typeof player.id !== 'string') {
        throw new Error(`Player at index ${index} must have a valid ID`);
      }
      if (!player.name || typeof player.name !== 'string') {
        throw new Error(`Player at index ${index} must have a valid name`);
      }
      if (!['sub', 'dom', 'vers'].includes(player.role)) {
        throw new Error(`Player at index ${index} must have a valid role`);
      }
      if (
        typeof player.location !== 'undefined' &&
        (typeof player.location !== 'number' || player.location < 0)
      ) {
        throw new Error(
          `Player at index ${index} must have a valid location (non-negative number)`
        );
      }
    });

    // Check for duplicate player IDs
    const playerIds = players.map((p) => p.id);
    const uniqueIds = new Set(playerIds);
    if (playerIds.length !== uniqueIds.size) {
      throw new Error('All players must have unique IDs');
    }

    // Check for duplicate player names
    const playerNames = players.map((p) => p.name.toLowerCase());
    const uniqueNames = new Set(playerNames);
    if (playerNames.length !== uniqueNames.size) {
      throw new Error('All players must have unique names');
    }

    if (!settings || typeof settings !== 'object') {
      throw new Error('Valid settings object is required');
    }
  }

  /**
   * Convert database session to session object
   * @private
   */
  private convertDbSessionToSession(dbSession: DBLocalPlayerSession): LocalPlayerSession {
    return {
      id: dbSession.sessionId,
      roomId: dbSession.roomId,
      players: dbSession.players,
      currentPlayerIndex: dbSession.currentPlayerIndex,
      isActive: dbSession.isActive,
      createdAt: dbSession.createdAt,
      updatedAt: dbSession.updatedAt,
      settings: dbSession.settings,
    };
  }
}

// Export singleton instance
export const localPlayerService = LocalPlayerService.getInstance();
