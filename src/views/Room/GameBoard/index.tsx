import { useRef, useEffect, useCallback, useState } from 'react';
import useAuth from '@/context/hooks/useAuth';
import actionStringReplacement from '@/services/actionStringReplacement';
import GameTile from './GameTile';
import TokenAnimationLayer, {
  type TokenAnimationLayerRef,
  type TokenPosition,
} from './TokenAnimationLayer';
import './styles.css';
import { Settings } from '@/types/Settings';
import { Tile, TileExport } from '@/types/gameBoard';
import type { LocalPlayer } from '@/types/localPlayers';
import { isLocalPlayer, type HybridPlayer } from '@/hooks/useHybridPlayerList';

interface PlayerWithLocation {
  uid: string;
  displayName: string;
  location?: number;
  isSelf?: boolean;
}

interface GameBoardProps {
  playerList: PlayerWithLocation[] | HybridPlayer[];
  isTransparent: boolean;
  gameBoard: TileExport[];
  settings: Settings;
}

export default function GameBoard({
  playerList,
  isTransparent,
  gameBoard,
  settings,
}: GameBoardProps): JSX.Element | null {
  const { user } = useAuth();
  const gameboardRef = useRef<HTMLDivElement>(null);
  const animationLayerRef = useRef<TokenAnimationLayerRef>(null);
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const previousPlayerLocations = useRef<Map<string, number>>(new Map());
  const scrollTargetRef = useRef<{ playerId: string; targetTile: number } | null>(null);
  const [animatingPlayer, setAnimatingPlayer] = useState<{
    playerId: string;
    targetTile: number;
  } | null>(null);
  const animationDebounceTimer = useRef<number | null>(null);
  const pendingAnimations = useRef<Map<string, TokenPosition>>(new Map());

  // Track player movement and trigger animations with debouncing
  const handlePlayerMovement = useCallback(() => {
    if (!animationLayerRef.current) return;

    playerList.forEach((player) => {
      const currentLocation = player.location || 0;
      const previousLocation = previousPlayerLocations.current.get(player.uid);

      if (previousLocation !== undefined && previousLocation !== currentLocation) {
        if (player.isSelf) {
          scrollTargetRef.current = { playerId: player.uid, targetTile: currentLocation };
        }

        const tokenPosition: TokenPosition = {
          playerId: player.uid,
          displayName: player.displayName,
          fromTile: previousLocation,
          toTile: currentLocation,
          isCurrent: player.isSelf || false,
        };

        pendingAnimations.current.set(player.uid, tokenPosition);
      }

      previousPlayerLocations.current.set(player.uid, currentLocation);
    });

    if (animationDebounceTimer.current) {
      clearTimeout(animationDebounceTimer.current);
    }

    animationDebounceTimer.current = window.setTimeout(() => {
      pendingAnimations.current.forEach((tokenPosition) => {
        setAnimatingPlayer({ playerId: tokenPosition.playerId, targetTile: tokenPosition.toTile });
        animationLayerRef.current?.animateTokenMovement(tokenPosition);
      });
      pendingAnimations.current.clear();
      animationDebounceTimer.current = null;
    }, 100);
  }, [playerList]);

  useEffect(() => {
    handlePlayerMovement();

    return () => {
      if (animationDebounceTimer.current) {
        clearTimeout(animationDebounceTimer.current);
      }
    };
  }, [handlePlayerMovement]);

  // Animation event handlers
  const handleAnimationStart = useCallback((_playerId: string) => {
    // Animation state already set in handlePlayerMovement to prevent race condition
    // This handler is now primarily for potential future enhancements
  }, []);

  const handleAnimationComplete = useCallback((playerId: string) => {
    if (scrollTargetRef.current?.playerId === playerId) {
      scrollTargetRef.current = null;
    }

    setAnimatingPlayer((current) => (current?.playerId === playerId ? null : current));
  }, []);

  // Handle animation progress for smooth scrolling
  const handleAnimationProgress = useCallback(
    (playerId: string, progress: number, _currentY: number) => {
      // Only scroll for the current player's animation
      if (scrollTargetRef.current?.playerId !== playerId) return;

      const targetTile = scrollTargetRef.current.targetTile;
      const targetElement = gameboardRef.current?.querySelector(
        `[data-tile-index="${targetTile}"]`
      );

      if (!targetElement || !gameboardRef.current) return;

      // Get the target element's position
      const targetRect = targetElement.getBoundingClientRect();
      const containerRect = gameboardRef.current.getBoundingClientRect();

      // Calculate the target scroll position (center the target tile)
      const targetScrollTop =
        gameboardRef.current.scrollTop +
        (targetRect.top - containerRect.top) -
        containerRect.height / 2 +
        targetRect.height / 2;

      // Get current scroll position
      const currentScrollTop = gameboardRef.current.scrollTop;

      // Interpolate between current and target scroll position based on animation progress
      const interpolatedScrollTop =
        currentScrollTop + (targetScrollTop - currentScrollTop) * progress;

      // Apply smooth scrolling with mobile compatibility
      try {
        // Detect mobile devices
        const isMobile =
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          ) ||
          'ontouchstart' in window ||
          window.innerWidth <= 768;

        if (isMobile) {
          // For mobile devices, use direct scrollTop assignment
          // This avoids conflicts with touch scrolling
          gameboardRef.current.scrollTop = interpolatedScrollTop;

          // Force a layout recalculation to ensure scroll happens
          gameboardRef.current.getBoundingClientRect();
        } else {
          // For desktop, use scrollTo with behavior auto
          gameboardRef.current.scrollTo({
            top: interpolatedScrollTop,
            behavior: 'auto',
          });
        }
      } catch {
        // Fallback for any scrolling errors (silently handle)
        // Simple fallback - just set scroll position
        if (gameboardRef.current) {
          gameboardRef.current.scrollTop = interpolatedScrollTop;
        }
      }
    },
    []
  );

  if (!Array.isArray(gameBoard) || !gameBoard.length) return null;

  // Extract local players if available for role-based player selection
  const localPlayers: LocalPlayer[] = [];
  if (playerList && Array.isArray(playerList)) {
    // Check if we're dealing with HybridPlayer array (which includes local players)
    const hybridPlayers = playerList as HybridPlayer[];
    hybridPlayers.forEach((player) => {
      if (isLocalPlayer(player)) {
        localPlayers.push({
          id: player.localId,
          name: player.displayName,
          role: player.role as any, // HybridPlayer role is string, LocalPlayer role is typed
          order: player.order,
          isActive: player.isSelf,
          deviceId: 'local-device',
          location: player.location,
          isFinished: player.isFinished,
        });
      }
    });
  }

  const tileTypeArray = new Set<string>();

  gameBoard.forEach(({ title }, index) => {
    if (title && index !== 0 && index !== gameBoard.length - 1) {
      tileTypeArray.add(title);
    }
  });

  const gameTiles = gameBoard.map((entry, index) => {
    const players = playerList.filter((player) => player.location === index);

    const isAnimationTargetTile = animatingPlayer?.targetTile === index;
    const animatingPlayerId = animatingPlayer?.playerId;

    // Pulse on destination tile during movement; otherwise mark the self tile as current (except start tile)
    const current =
      isAnimationTargetTile && animatingPlayerId
        ? playerList.find((player) => player.uid === animatingPlayerId) || null
        : index > 0
          ? (players.find((p) => p.isSelf) ?? null)
          : null;
    const hueIndex = (Array.from(tileTypeArray).indexOf(entry.title) % 10) + 1;

    const description =
      !settings.hideBoardActions || index === 0 || current
        ? actionStringReplacement(
            entry.description || '',
            settings.role || 'sub',
            user?.displayName || '',
            localPlayers.length > 0 ? localPlayers : undefined,
            true, // Use generic placeholders for GameBoard display
            settings.gender,
            settings.locale
          )
        : // replace only letters and numbers with question marks. Remove special characters.
          (entry.description || '').replace(/[^\w\s]/g, '').replace(/[a-zA-Z0-9]/g, '?');

    // Convert TileExport to full Tile object
    const tile: Tile = {
      id: index,
      title: entry.title,
      description: entry.description,
      index,
      players: players.map((p) => ({ ...p, isSelf: p.isSelf || false, isFinished: false })),
      current: current ? { ...current, isSelf: current.isSelf || false, isFinished: false } : null,
      isTransparent,
      className: `hue${hueIndex}`,
    };

    return (
      <GameTile
        key={index}
        title={`#${index + 1}: ${entry.title}`}
        description={description}
        players={tile.players}
        current={tile.current}
        isTransparent={tile.isTransparent}
        className={tile.className}
        // isPlayerAnimating prop removed - scroll logic moved to GameBoard component
      />
    );
  });

  return (
    <div className="gameboard-container-query-wrapper">
      <div
        ref={(el) => {
          gameboardRef.current = el;
          setContainerEl(el);
        }}
        className="gameboard transparent-scrollbar"
        style={{ position: 'relative' }}
      >
        <div style={{ position: 'relative' }}>
          <ol>{gameTiles}</ol>
          <TokenAnimationLayer
            ref={animationLayerRef}
            gameBoard={containerEl}
            onAnimationStart={handleAnimationStart}
            onAnimationComplete={handleAnimationComplete}
            onAnimationProgress={handleAnimationProgress}
          />
        </div>
      </div>
    </div>
  );
}
