import type {
  LocalPlayer,
  LocalPlayerSession,
  LocalSessionSettings,
  DBLocalPlayerSession,
} from '@/types';

import { create } from 'zustand';
import { localPlayerService } from '@/services/localPlayerService';
import { persist } from 'zustand/middleware';
import db from '@/stores/store';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * State interface for local player store
 */
interface LocalPlayerState {
  // Current session data
  session: LocalPlayerSession | null;

  // Error state
  error: string | null;

  // Loading state
  isLoading: boolean;

  // Getters
  hasLocalPlayers: () => boolean;
  isLocalPlayerRoom: () => boolean;
  getCurrentPlayer: () => LocalPlayer | null;

  // Actions
  setSession: (session: LocalPlayerSession | null) => void;
  clearSession: () => Promise<void>;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;

  // Async actions
  initSession: (
    roomId: string,
    players: LocalPlayer[],
    settings: LocalSessionSettings
  ) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  nextLocalPlayer: () => Promise<void>;
  updateSessionSettings: (settings: LocalSessionSettings) => Promise<void>;

  // Internal helpers
  _migrateSession: (rawSession: any) => LocalPlayerSession | null;
}

/**
 * Zustand store for local player state management
 * Handles session state, player management, and turn advancement
 */
export const useLocalPlayerStore = create<LocalPlayerState>()(
  persist(
    (set, get) => ({
      // Initial state
      session: null,
      error: null,
      isLoading: false,

      // Getters
      hasLocalPlayers: () => {
        const session = get().session;
        return session?.isActive === true && session.players.length > 0;
      },

      isLocalPlayerRoom: () => {
        const session = get().session;
        return session?.isActive === true;
      },

      getCurrentPlayer: () => {
        const session = get().session;
        if (!session?.isActive || !session.players || session.players.length === 0) {
          return null;
        }

        const currentIndex = session.currentPlayerIndex || 0;
        const player = session.players[currentIndex];
        if (!player) return null;

        // Migration: Ensure player has required fields (create copy to maintain immutability)
        const migratedPlayer = { ...player };
        if (typeof migratedPlayer.location !== 'number') {
          migratedPlayer.location = 0;
        }
        if (typeof migratedPlayer.isFinished !== 'boolean') {
          migratedPlayer.isFinished = false;
        }
        // Only set default gender if it's explicitly undefined or null (not empty string)
        if (migratedPlayer.gender === undefined || migratedPlayer.gender === null) {
          migratedPlayer.gender = 'non-binary';
        }

        return migratedPlayer;
      },

      // Basic actions
      setSession: (session) => {
        // Migrate session if needed
        const migratedSession = session ? get()._migrateSession(session) : null;
        set({ session: migratedSession, error: null });
      },

      // Internal migration helper
      _migrateSession: (rawSession: any): LocalPlayerSession | null => {
        if (!rawSession || !rawSession.players) {
          return rawSession;
        }

        // Migrate players to ensure they have required fields
        const migratedPlayers = rawSession.players.map((player: any) => ({
          ...player,
          location: typeof player.location === 'number' ? player.location : 0,
          isFinished: typeof player.isFinished === 'boolean' ? player.isFinished : false,
          sound: player.sound || '',
          // Only set default gender if it's explicitly undefined or null
          gender:
            player.gender !== undefined && player.gender !== null ? player.gender : 'non-binary',
        }));

        return {
          ...rawSession,
          players: migratedPlayers,
        };
      },

      clearSession: async () => {
        const currentSession = get().session;

        // Delete ALL sessions for this room from Dexie database
        // This clears out any stale sessions that might be lingering
        if (currentSession?.roomId) {
          try {
            // Delete all sessions for this room, not just current session
            await db.localPlayerSessions.where('roomId').equals(currentSession.roomId).delete();
          } catch {
            // Silently fail - sessions might not exist in database
          }
        }

        // Clear wizard fields from settings store to prevent resurrection
        // These fields may have been saved by accident during wizard flow
        const settingsState = useSettingsStore.getState();
        const currentSettings = settingsState.settings;
        const hasWizardFields =
          'localPlayersData' in currentSettings ||
          'localPlayerSessionSettings' in currentSettings ||
          'hasLocalPlayers' in currentSettings;

        if (hasWizardFields) {
          const cleanedSettings = { ...currentSettings };
          delete (cleanedSettings as any).localPlayersData;
          delete (cleanedSettings as any).localPlayerSessionSettings;
          delete (cleanedSettings as any).hasLocalPlayers;
          settingsState.updateSettings(cleanedSettings);
        }

        // Clear from service and store
        localPlayerService.clearCurrentSession();
        set({ session: null, error: null });
      },

      setError: (error) => {
        set({ error, isLoading: false });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      // Async actions
      initSession: async (roomId, players, settings) => {
        try {
          set({ isLoading: true, error: null });

          const session = await localPlayerService.createSession(roomId, players, settings);

          set({
            session,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
          set({
            error: errorMessage,
            isLoading: false,
            session: null,
          });
        }
      },

      loadSession: async (sessionId) => {
        try {
          set({ isLoading: true, error: null });

          const session = await localPlayerService.getSession(sessionId);

          set({
            session,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load session';
          set({
            error: errorMessage,
            isLoading: false,
            session: null,
          });
        }
      },

      nextLocalPlayer: async () => {
        try {
          set({ isLoading: true, error: null });

          const currentSession = get().session;
          if (!currentSession) {
            throw new Error('No active session');
          }

          // Advance turn through service
          await localPlayerService.advanceLocalTurn(currentSession.id);

          // Reload session to get updated state
          const updatedSession = await localPlayerService.getSession(currentSession.id);

          set({
            session: updatedSession,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to advance turn';
          set({
            error: errorMessage,
            isLoading: false,
          });
        }
      },

      updateSessionSettings: async (settings) => {
        try {
          set({ isLoading: true, error: null });

          const currentSession = get().session;
          if (!currentSession) {
            throw new Error('No active session');
          }

          // Update session settings through service
          const updatedSession = await localPlayerService.updateSession(currentSession.id, {
            settings,
          });

          set({
            session: updatedSession,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to update session settings';
          set({
            error: errorMessage,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'local-player-store',
      // Only persist session data, not loading/error states
      partialize: (state) => ({
        session: state.session,
      }),
      // Migrate session data on rehydration and reset loading/error states
      onRehydrateStorage: () => async (state) => {
        if (state) {
          // Migrate session if it exists to ensure all fields are present
          if (state.session) {
            const migratedSession = state._migrateSession(state.session);
            if (!migratedSession) {
              state.session = null;
              state.isLoading = false;
              state.error = null;
              return;
            }

            state.session = migratedSession;

            // IMPORTANT: Sync session to database after rehydration
            // The persist middleware saves to localStorage, but we also need it in Dexie
            try {
              const dbSession = await localPlayerService.getSession(migratedSession.id);
              if (!dbSession) {
                // Session exists in localStorage but not in database
                // First, clean up any old sessions for this room to prevent duplicates
                await db.localPlayerSessions
                  .where('roomId')
                  .equals(migratedSession.roomId)
                  .delete();

                // Now save the current session
                const dbSessionData: DBLocalPlayerSession = {
                  sessionId: migratedSession.id,
                  roomId: migratedSession.roomId,
                  players: migratedSession.players,
                  currentPlayerIndex: migratedSession.currentPlayerIndex,
                  isActive: migratedSession.isActive,
                  createdAt: migratedSession.createdAt,
                  updatedAt: migratedSession.updatedAt,
                  settings: migratedSession.settings,
                };
                await db.localPlayerSessions.add(dbSessionData);
              }
            } catch {
              // Silently fail - session will be recreated if needed
            }
          }
          state.isLoading = false;
          state.error = null;
        }
      },
    }
  )
);
