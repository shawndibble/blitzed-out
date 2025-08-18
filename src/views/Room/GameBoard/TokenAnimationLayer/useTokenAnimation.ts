import { useState, useCallback } from 'react';
import type { FLIPData } from './TokenController';

export interface AnimatingToken {
  id: string;
  displayName: string;
  fromTile: number;
  toTile: number;
  isCurrent: boolean;
  flipData: FLIPData;
  startTime: number;
  onAnimationProgress?: (playerId: string, progress: number, currentY: number) => void;
}

export interface UseTokenAnimationReturn {
  animatingTokens: AnimatingToken[];
  addAnimatingToken: (token: AnimatingToken) => void;
  removeAnimatingToken: (playerId: string) => void;
  clearAllTokens: () => void;
  isTokenAnimating: (playerId: string) => boolean;
}

export function useTokenAnimation(): UseTokenAnimationReturn {
  const [animatingTokens, setAnimatingTokens] = useState<AnimatingToken[]>([]);

  const addAnimatingToken = useCallback((token: AnimatingToken) => {
    setAnimatingTokens((current) => {
      // Remove any existing animation for this player
      const filtered = current.filter((t) => t.id !== token.id);
      return [...filtered, token];
    });
  }, []);

  const removeAnimatingToken = useCallback((playerId: string) => {
    setAnimatingTokens((current) => current.filter((t) => t.id !== playerId));
  }, []);

  const clearAllTokens = useCallback(() => {
    setAnimatingTokens([]);
  }, []);

  const isTokenAnimating = useCallback(
    (playerId: string) => {
      return animatingTokens.some((t) => t.id === playerId);
    },
    [animatingTokens]
  );

  return {
    animatingTokens,
    addAnimatingToken,
    removeAnimatingToken,
    clearAllTokens,
    isTokenAnimating,
  };
}
