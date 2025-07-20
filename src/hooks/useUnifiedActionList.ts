import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllAvailableGroups } from '@/stores/customGroups';
import { GroupedActions } from '@/types/customTiles';

interface UnifiedActionListResult {
  actionsList: GroupedActions;
  isLoading: boolean;
}

// Simple cache to prevent duplicate API calls
const actionsCache = new Map<string, { data: GroupedActions; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

/**
 * Hook that combines default actions from locale files with custom groups from Dexie
 * into a unified structure that can be used by the existing IncrementalSelect component
 */
export default function useUnifiedActionList(gameMode?: string): UnifiedActionListResult {
  const { i18n } = useTranslation();
  const [actionsList, setActionsList] = useState<GroupedActions>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Memoize the cache key to prevent unnecessary recalculations
  const cacheKey = useMemo(() => {
    if (!gameMode || !i18n.resolvedLanguage) return '';
    return `${i18n.resolvedLanguage}-${gameMode}`;
  }, [i18n.resolvedLanguage, gameMode]);

  // Check cache immediately on render to prevent unnecessary loading states
  useMemo(() => {
    if (cacheKey) {
      const cached = actionsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setActionsList(cached.data);
        setIsLoading(false);
      }
    }
  }, [cacheKey]);

  const loadUnifiedActions = useCallback(async (): Promise<void> => {
    if (!gameMode || !cacheKey) return;

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
          None: [], // Always include None option for consistency
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
      console.error('Error loading unified actions:', error);
      setActionsList({});
    } finally {
      setIsLoading(false);
    }
  }, [gameMode, i18n.resolvedLanguage, cacheKey]);

  useEffect(() => {
    if (cacheKey) {
      loadUnifiedActions();
    }
  }, [loadUnifiedActions, cacheKey]);

  return { actionsList, isLoading };
}
