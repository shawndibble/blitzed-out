import { useMemo } from 'react';
import { useLocalPlayers } from './useLocalPlayers';
import usePlayerList from './usePlayerList';

interface BasePlayer {
  displayName: string;
  uid: string;
  isSelf: boolean;
  location: number;
  isFinished: boolean;
  status: 'active' | 'idle' | 'away';
  lastActivity: Date;
}

export interface LocalPlayerExtended extends BasePlayer {
  isLocal: true;
  localId: string;
  role: string;
  order: number;
}

interface RemotePlayer extends BasePlayer {
  isLocal: false;
}

export type HybridPlayer = LocalPlayerExtended | RemotePlayer;

/**
 * Hook that provides a combined list of local and remote players
 * Shows local players when in local multiplayer mode, otherwise shows remote players
 */
export default function useHybridPlayerList(): HybridPlayer[] {
  const remotePlayerList = usePlayerList();
  const { localPlayers, hasLocalPlayers, isLocalPlayerRoom } = useLocalPlayers();

  const hybridPlayerList = useMemo(() => {
    const players: HybridPlayer[] = [];

    // Include remote players (will be excluded in local multiplayer mode)
    const remotePlayersTyped: RemotePlayer[] = remotePlayerList.map((player) => ({
      ...player,
      isLocal: false as const,
    }));
    players.push(...remotePlayersTyped);

    // Use local players when in local multiplayer mode (multiple players on single device)
    if (hasLocalPlayers && isLocalPlayerRoom) {
      const localPlayersTyped: LocalPlayerExtended[] = localPlayers
        .map((localPlayer) => ({
          displayName: localPlayer.name,
          uid: `local-${localPlayer.id}`, // Unique identifier for local players
          isSelf: localPlayer.isActive, // Local active player is considered "self"
          location: localPlayer.location, // Each local player has their own board position
          isFinished: localPlayer.isFinished, // Track completion status per player
          status: 'active' as const, // Local players are always active when in session
          lastActivity: new Date(), // Local players have current activity
          isLocal: true as const,
          localId: localPlayer.id,
          role: localPlayer.role,
          order: localPlayer.order,
        }))
        .sort((a, b) => a.order - b.order); // Sort by turn order

      // In local multiplayer mode, show only local players in turn order
      // Don't include remote players when in local multiplayer mode
      return localPlayersTyped;
    }

    return players;
  }, [remotePlayerList, localPlayers, hasLocalPlayers, isLocalPlayerRoom]);

  return hybridPlayerList;
}

/**
 * Type guard to check if a player is a local player
 */
export function isLocalPlayer(player: HybridPlayer): player is LocalPlayerExtended {
  return player.isLocal === true;
}

/**
 * Type guard to check if a player is a remote player
 */
export function isRemotePlayer(player: HybridPlayer): player is RemotePlayer {
  return player.isLocal === false;
}
