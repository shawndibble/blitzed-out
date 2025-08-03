import { useCallback, useMemo } from 'react';
import { useLocalPlayerStore } from '@/stores/localPlayerStore';
import type { LocalPlayer, LocalSessionSettings } from '@/types';

/**
 * Hook for local player management in single-device multiplayer mode
 * Provides easy access to local player state and actions
 */
export function useLocalPlayers() {
  // Get state from store
  const {
    session,
    error,
    isLoading,
    hasLocalPlayers,
    isLocalPlayerRoom,
    getCurrentPlayer,
    setSession,
    clearSession,
    setError,
    setLoading,
    initSession,
    loadSession,
    nextLocalPlayer,
    updateSessionSettings,
  } = useLocalPlayerStore();

  // Memoized getters
  const localPlayers = useMemo(() => session?.players || [], [session?.players]);
  const currentPlayer = getCurrentPlayer();
  const currentPlayerIndex = session?.currentPlayerIndex ?? -1;
  const sessionSettings = session?.settings;

  // Memoized actions
  const createLocalSession = useCallback(
    async (roomId: string, players: LocalPlayer[], settings: LocalSessionSettings) => {
      await initSession(roomId, players, settings);
    },
    [initSession]
  );

  const loadLocalSession = useCallback(
    async (sessionId: string) => {
      await loadSession(sessionId);
    },
    [loadSession]
  );

  const advanceToNextPlayer = useCallback(async () => {
    await nextLocalPlayer();
  }, [nextLocalPlayer]);

  const clearLocalSession = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const updateSettings = useCallback(
    async (settings: LocalSessionSettings) => {
      await updateSessionSettings(settings);
    },
    [updateSessionSettings]
  );

  // Utility functions
  const getPlayerByIndex = useCallback(
    (index: number): LocalPlayer | null => {
      if (index >= 0 && index < localPlayers.length) {
        return localPlayers[index];
      }
      return null;
    },
    [localPlayers]
  );

  const getPlayerById = useCallback(
    (playerId: string): LocalPlayer | null => {
      return localPlayers.find((player) => player.id === playerId) || null;
    },
    [localPlayers]
  );

  const isPlayerActive = useCallback(
    (playerId: string): boolean => {
      const player = getPlayerById(playerId);
      return player?.isActive === true;
    },
    [getPlayerById]
  );

  const getNextPlayer = useCallback((): LocalPlayer | null => {
    if (localPlayers.length === 0) return null;
    const nextIndex = (currentPlayerIndex + 1) % localPlayers.length;
    return getPlayerByIndex(nextIndex);
  }, [localPlayers, currentPlayerIndex, getPlayerByIndex]);

  const getPreviousPlayer = useCallback((): LocalPlayer | null => {
    if (localPlayers.length === 0) return null;
    const prevIndex = currentPlayerIndex === 0 ? localPlayers.length - 1 : currentPlayerIndex - 1;
    return getPlayerByIndex(prevIndex);
  }, [localPlayers, currentPlayerIndex, getPlayerByIndex]);

  return {
    // State
    session,
    localPlayers,
    currentPlayer,
    currentPlayerIndex,
    sessionSettings,
    error,
    isLoading,

    // Computed state
    hasLocalPlayers: hasLocalPlayers(),
    isLocalPlayerRoom: isLocalPlayerRoom(),
    playerCount: localPlayers.length,
    isValidSession: session?.isActive === true && localPlayers.length >= 2,

    // Actions
    createLocalSession,
    loadLocalSession,
    clearLocalSession,
    advanceToNextPlayer,
    updateSettings,

    // Utilities
    getPlayerByIndex,
    getPlayerById,
    isPlayerActive,
    getNextPlayer,
    getPreviousPlayer,

    // Direct store access (for advanced use cases)
    setSession,
    setError,
    setLoading,
  };
}
