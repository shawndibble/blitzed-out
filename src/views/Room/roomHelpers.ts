import { isOnlineMode } from '@/helpers/strings';
import { Settings } from '@/types/Settings';
import { HybridPlayer } from '@/hooks/useHybridPlayerList';

/**
 * Helper functions for Room component to reduce code duplication
 */

/**
 * Calculate game mode based on settings
 */
export function getGameMode(settings: Settings): 'online' | 'local' {
  return isOnlineMode(settings.gameMode) ? 'online' : 'local';
}

/**
 * Calculate player count from hybrid and local player lists
 */
export function getPlayerCount(
  hybridPlayerList?: HybridPlayer[],
  localPlayersLength?: number
): number {
  return Math.max(1, hybridPlayerList?.length ?? localPlayersLength ?? 1);
}

/**
 * Get analytics data for game session tracking
 */
export function getGameSessionAnalytics(
  settings: Settings,
  hybridPlayerList?: HybridPlayer[],
  localPlayersLength?: number
) {
  return {
    gameMode: getGameMode(settings),
    playerCount: getPlayerCount(hybridPlayerList, localPlayersLength),
  };
}

/**
 * Check if the room is ready to render (has required data)
 */
export function isRoomReady(
  gameBoard: any[] | undefined,
  settings: Record<string, any>,
  room: string,
  gameMode: string,
  isImporting: boolean
): boolean {
  return !(
    (!gameBoard ||
      !gameBoard.length ||
      !Object.keys(settings).length ||
      (room?.toUpperCase() === 'PUBLIC' && !isOnlineMode(gameMode))) &&
    !isImporting
  );
}
