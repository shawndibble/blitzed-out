import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  recordTileLanding,
  recordGameComplete,
  recordGameStart,
  recordBoardCategories,
  recordIntensities,
} from '@/services/playerStatsService';

interface UseStatsTrackingResult {
  trackTileLanding: (category: string) => void;
  trackGameComplete: (boardCategories: string[], intensities?: string[]) => void;
  trackGameStart: () => void;
}

export function useStatsTracking(): UseStatsTrackingResult {
  const { user } = useAuth();
  const oderId = user?.uid || 'anonymous';

  const trackTileLanding = useCallback(
    (category: string) => {
      if (category && category !== 'START' && category !== 'FINISH') {
        recordTileLanding(oderId, category).catch(() => {
          // Silently handle - stats are non-critical
        });
      }
    },
    [oderId]
  );

  const trackGameComplete = useCallback(
    (boardCategories: string[], intensities?: string[]) => {
      recordGameComplete(oderId).catch(() => {
        // Silently handle - stats are non-critical
      });

      const filteredCategories = boardCategories.filter(
        (title) => title && title !== 'START' && title !== 'FINISH'
      );

      recordBoardCategories(oderId, filteredCategories).catch(() => {
        // Silently handle - stats are non-critical
      });

      if (intensities?.length) {
        recordIntensities(oderId, intensities).catch(() => {
          // Silently handle - stats are non-critical
        });
      }
    },
    [oderId]
  );

  const trackGameStart = useCallback(() => {
    recordGameStart(oderId).catch(() => {
      // Silently handle - stats are non-critical
    });
  }, [oderId]);

  return {
    trackTileLanding,
    trackGameComplete,
    trackGameStart,
  };
}
