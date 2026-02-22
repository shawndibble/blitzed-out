import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  recordTileLanding,
  recordGameComplete,
  recordGameStart,
  recordBoardCategories,
  recordIntensities,
} from '@/services/playerStatsService';

const noopStatsErrorHandler = (): void => {
  // Stats are non-critical - silently ignore errors
};

export interface UseStatsTrackingResult {
  trackTileLanding: (category: string) => void;
  trackGameComplete: (boardCategories: string[], intensities?: string[]) => void;
  trackGameStart: () => void;
}

export function useStatsTracking(): UseStatsTrackingResult {
  const { user } = useAuth();
  const ownerId = user?.uid || 'anonymous';

  const trackTileLanding = useCallback(
    (category: string) => {
      if (category && category !== 'START' && category !== 'FINISH') {
        recordTileLanding(ownerId, category).catch(noopStatsErrorHandler);
      }
    },
    [ownerId]
  );

  const trackGameComplete = useCallback(
    (boardCategories: string[], intensities?: string[]) => {
      recordGameComplete(ownerId).catch(noopStatsErrorHandler);

      const filteredCategories = boardCategories.filter(
        (title) => title && title !== 'START' && title !== 'FINISH'
      );

      recordBoardCategories(ownerId, filteredCategories).catch(noopStatsErrorHandler);

      if (intensities?.length) {
        recordIntensities(ownerId, intensities).catch(noopStatsErrorHandler);
      }
    },
    [ownerId]
  );

  const trackGameStart = useCallback(() => {
    recordGameStart(ownerId).catch(noopStatsErrorHandler);
  }, [ownerId]);

  return {
    trackTileLanding,
    trackGameComplete,
    trackGameStart,
  };
}
