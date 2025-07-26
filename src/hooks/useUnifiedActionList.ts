import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllAvailableGroups } from '@/stores/customGroups';
import { GroupedActions } from '@/types/customTiles';
import { UNIFIED_ACTION_CACHE_TTL } from '@/constants/actionConstants';

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
  const [actionsList, setActionsList] = useState<GroupedActions>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Track language changes for debugging
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
        if (group.intensities && Array.isArray(group.intensities)) {
          group.intensities
            .sort((a, b) => a.value - b.value)
            .forEach((intensity) => {
              actions[intensity.label] = []; // Empty array since custom groups don't have predefined actions
            });
        }

        const finalType = group.type || 'action';

        unifiedActions[group.name] = {
          label: group.label || group.name,
          type: finalType, // Use the preserved type from migration
          actions,
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
  }, [gameMode, i18n.resolvedLanguage, cacheKey, t]);

  useEffect(() => {
    if (cacheKey) {
      loadUnifiedActions();
    }
  }, [loadUnifiedActions, cacheKey]);

  return { actionsList, isLoading };
}
