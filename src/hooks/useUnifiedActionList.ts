import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllAvailableGroups } from '@/stores/customGroups';
import { GroupedActions } from '@/types/customTiles';
import { UNIFIED_ACTION_CACHE_TTL } from '@/constants/actionConstants';
import { useMigration } from '@/context/migration';

interface UnifiedActionListResult {
  actionsList: GroupedActions;
  isLoading: boolean;
}

// Simple cache to prevent duplicate API calls
const actionsCache = new Map<string, { data: GroupedActions; timestamp: number }>();
const CACHE_TTL = UNIFIED_ACTION_CACHE_TTL;

// Debug function to inspect cache
(window as any).debugActionsCache = () => {};

// Debug function to clear cache
(window as any).clearActionsCache = () => {
  actionsCache.clear();
};

/**
 * Hook that combines default actions from locale files with custom groups from Dexie
 * into a unified structure that can be used by the existing IncrementalSelect component
 *
 * @param gameMode - The game mode to filter groups by (e.g., 'online', 'local')
 * @returns Object containing the unified actions list and loading state
 *
 * Features:
 * - Caches results for 30 seconds to improve performance
 * - Automatically handles locale changes
 * - Filters groups by game mode
 * - Converts custom groups to the expected format for UI components
 */
export default function useUnifiedActionList(gameMode?: string): UnifiedActionListResult {
  const { i18n, t } = useTranslation();
  const { currentLanguageMigrated, isHealthy, forceRecovery } = useMigration();
  const [actionsList, setActionsList] = useState<GroupedActions>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [recoveryAttempted, setRecoveryAttempted] = useState<boolean>(false);

  // Track language changes and migration status for debugging
  useEffect(() => {
    const handleLanguageChange = () => {
      // Clear cache for all languages since the user changed language
      if (gameMode) {
        const oldCacheKeys = Array.from(actionsCache.keys()).filter((key) =>
          key.endsWith(`-${gameMode}`)
        );
        oldCacheKeys.forEach((key) => {
          actionsCache.delete(key);
        });
      }
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n, gameMode]);

  // Memoize the cache key to prevent unnecessary recalculations
  const cacheKey = useMemo(() => {
    if (!gameMode || !i18n.resolvedLanguage) return '';
    return `${i18n.resolvedLanguage}-${gameMode}`;
  }, [i18n.resolvedLanguage, gameMode]);

  // Clear cache when migration status changes from false to true
  useEffect(() => {
    if (currentLanguageMigrated && cacheKey) {
      // Migration just completed - clear cache to force fresh load
      const cached = actionsCache.get(cacheKey);
      if (cached) {
        actionsCache.delete(cacheKey);
      }
    }
  }, [currentLanguageMigrated, cacheKey]);

  // Check cache immediately on render to prevent unnecessary loading states
  // Using useEffect instead of useMemo to avoid side effects in useMemo
  useEffect(() => {
    if (cacheKey) {
      const cached = actionsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setActionsList(cached.data);
        setIsLoading(false);
      }
    }
  }, [cacheKey]);

  const loadUnifiedActions = useCallback(async (): Promise<void> => {
    if (!gameMode || !cacheKey) {
      console.warn('⚠️ useUnifiedActionList: Missing required params', { gameMode, cacheKey });
      return;
    }

    // Wait for migration to complete before loading actions
    if (!currentLanguageMigrated) {
      return;
    }

    // If migration is complete but health check failed, attempt recovery once
    if (currentLanguageMigrated && !isHealthy && !recoveryAttempted) {
      setRecoveryAttempted(true);
      try {
        await forceRecovery();
        // Recovery will trigger a re-render, so return and let the next call handle loading
        return;
      } catch {
        // Continue with loading attempt even if recovery fails
      }
    }

    // Check cache first
    const cached = actionsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setActionsList(cached.data);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Load all available groups from Dexie (includes both default and custom groups)
      const allGroups = await getAllAvailableGroups(i18n.resolvedLanguage, gameMode);

      // Convert all groups to unified actions structure
      const unifiedActions: GroupedActions = {};

      for (const group of allGroups) {
        // Convert group to the same structure as expected by components
        const actions: Record<string, string[]> = {
          [t('none')]: [], // Always include None option for consistency
        };

        // Add intensity levels as action keys with empty arrays
        // The IncrementalSelect component uses these keys as menu items
        const intensities: Record<number, string> = {};
        if (group.intensities && Array.isArray(group.intensities)) {
          group.intensities
            .sort((a, b) => a.value - b.value)
            .forEach((intensity) => {
              actions[intensity.label] = []; // Empty array since custom groups don't have predefined actions
              intensities[intensity.value] = intensity.label; // Map level to name
            });
        }

        const finalType = group.type || 'action';

        unifiedActions[group.name] = {
          label: group.label || group.name,
          type: finalType, // Use the preserved type from migration
          actions,
          intensities, // Add the intensities mapping
        };
      }

      // Cache the result
      actionsCache.set(cacheKey, {
        data: unifiedActions,
        timestamp: Date.now(),
      });

      setActionsList(unifiedActions);
    } catch (error) {
      console.error('❌ useUnifiedActionList: Error loading unified actions', {
        error,
        locale: i18n.resolvedLanguage,
        gameMode,
        cacheKey,
      });
      setActionsList({});
    } finally {
      setIsLoading(false);
    }
  }, [
    gameMode,
    i18n.resolvedLanguage,
    cacheKey,
    t,
    currentLanguageMigrated,
    isHealthy,
    recoveryAttempted,
    forceRecovery,
  ]);

  useEffect(() => {
    if (cacheKey && currentLanguageMigrated) {
      loadUnifiedActions();
    }
  }, [loadUnifiedActions, cacheKey, currentLanguageMigrated, isHealthy]);

  return { actionsList, isLoading };
}
