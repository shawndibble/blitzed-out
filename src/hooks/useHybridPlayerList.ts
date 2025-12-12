import { useMemo } from 'react';
import { useLocalPlayers } from './useLocalPlayers';
import usePlayerList from './usePlayerList';
import useAuth from '@/context/hooks/useAuth';
import useMessages from '@/context/hooks/useMessages';
import { orderedMessagesByType } from '@/helpers/messages';

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
 * Always ensures at least the current user is shown
 */
export default function useHybridPlayerList(): HybridPlayer[] {
  const { user } = useAuth();
  const remotePlayerList = usePlayerList();
  const { localPlayers, hasLocalPlayers, isLocalPlayerRoom } = useLocalPlayers();
  const { messages } = useMessages();

  const hybridPlayerList = useMemo(() => {
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

    // Not in local multiplayer mode - show remote players
    const remotePlayersTyped: RemotePlayer[] = remotePlayerList.map((player) => ({
      ...player,
      isLocal: false as const,
    }));

    // If no players and user exists, ensure current user is in the list
    // This prevents empty player list after deleting local session
    if (remotePlayersTyped.length === 0 && user) {
      // Try to get location from messages
      const userActions = orderedMessagesByType(messages, 'actions', 'DESC');
      const lastAction = userActions.find((m) => m.uid === user.uid);
      let location = 0;

      if (lastAction?.text) {
        const match = lastAction.text.match(/#(\d+):/);
        if (match) {
          // Messages show 1-indexed position, convert to 0-indexed for GameBoard
          location = Math.max(0, Number(match[1]) - 1);
        }
      }

      remotePlayersTyped.push({
        displayName: user.displayName || 'You',
        uid: user.uid,
        isSelf: true,
        location,
        isFinished: false,
        status: 'active',
        lastActivity: new Date(),
        isLocal: false as const,
      });
    }

    return remotePlayersTyped;
  }, [user, remotePlayerList, localPlayers, hasLocalPlayers, isLocalPlayerRoom, messages]);

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
