import { useMemo, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import i18next from 'i18next';
import { CustomGroupPull } from '@/types/customGroups';
import { getCustomGroups, getCustomGroupsWithTiles } from '@/stores/customGroups';
import { getTileCountsByGroup } from '@/stores/customTiles';

export type GroupFilterContext = 'setup' | 'advanced' | 'manage' | 'editor';

interface GroupWithTileInfo extends Omit<CustomGroupPull, 'intensities'> {
  tileCount?: number;
  intensities?: Record<number, number>;
}

/**
 * Hook for context-aware group filtering
 * - setup/advanced: Only groups with tiles
 * - manage: All groups regardless of tile count
 * - editor: All groups filtered by game mode
 */
export const useContextualGroups = (
  context: GroupFilterContext,
  gameMode?: string,
  options: {
    includeDefaults?: boolean;
    includeTileCounts?: boolean;
    locale?: string;
    refreshTrigger?: number; // Allow external refresh trigger
  } = {}
) => {
  const [groups, setGroups] = useState<GroupWithTileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalRefreshTrigger, setInternalRefreshTrigger] = useState(0);

  const locale = options.locale || i18next.resolvedLanguage || i18next.language || 'en';
  const mode = gameMode || 'online';

  // Combine internal and external refresh triggers
  const combinedRefreshTrigger = (options.refreshTrigger || 0) + internalRefreshTrigger;

  useEffect(() => {
    let mounted = true;

    const loadGroups = async () => {
      try {
        setLoading(true);
        setError(null);

        let groupsData: CustomGroupPull[] = [];

        switch (context) {
          case 'setup':
          case 'advanced':
            // Only groups that have tiles
            groupsData = await getCustomGroupsWithTiles(locale, mode);
            break;

          case 'manage':
            // All groups regardless of tile count
            groupsData = await getCustomGroups({
              locale,
              gameMode: mode,
              isDefault: options.includeDefaults ? undefined : false,
            });
            break;

          case 'editor':
            // All groups for the specific game mode (for tile creation)
            groupsData = await getCustomGroups({
              locale,
              gameMode: mode,
            });
            break;
        }

        if (!mounted) return;

        // Add tile count information if requested
        if (options.includeTileCounts) {
          const tileCounts = await getTileCountsByGroup(locale, mode);

          const groupsWithCounts: GroupWithTileInfo[] = groupsData.map((group) => {
            // Key lookup: getTileCountsByGroup uses group_id as key (tile.group_id || tile.group)
            // So we need to look up using group.id (which is the group_id that tiles reference)
            const tileCountData = tileCounts[group.id];

            return {
              ...group,
              tileCount: tileCountData?.count || 0,
              intensityDistribution: tileCountData?.intensities || {},
              intensities: tileCountData?.intensities || {},
            };
          });

          setGroups(groupsWithCounts);
        } else {
          // Transform groups without tile counts
          const transformedGroups: GroupWithTileInfo[] = groupsData.map((group) => {
            return {
              ...group,
              tileCount: 0,
              intensityDistribution: {},
              intensities: {},
            };
          });
          setGroups(transformedGroups);
        }
      } catch (err) {
        if (!mounted) return;
        console.error(`Error loading groups for context ${context}:`, err);
        setError(err instanceof Error ? err.message : 'Failed to load groups');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadGroups();

    return () => {
      mounted = false;
    };
  }, [
    context,
    locale,
    mode,
    options.includeDefaults,
    options.includeTileCounts,
    combinedRefreshTrigger,
  ]);

  const groupsWithMetadata = useMemo(() => {
    return groups.map((group) => ({
      ...group,
      hasNoTiles: (group.tileCount ?? 0) === 0,
      isAvailableForSetup:
        context === 'setup' || context === 'advanced' ? (group.tileCount ?? 0) > 0 : true,
    }));
  }, [groups, context]);

  return {
    groups: groupsWithMetadata,
    loading,
    error,
    isEmpty: groups.length === 0,
    refresh: () => {
      setInternalRefreshTrigger((prev) => prev + 1);
    },
  };
};

/**
 * Specific hook for setup wizard - only groups with tiles
 */
export const useSetupGroups = (gameMode?: string, locale?: string) => {
  return useContextualGroups('setup', gameMode, {
    includeTileCounts: true,
    locale,
  });
};

/**
 * Specific hook for advanced settings - only groups with tiles
 */
export const useAdvancedSettingsGroups = (gameMode?: string, locale?: string) => {
  return useContextualGroups('advanced', gameMode, {
    includeTileCounts: true,
    locale,
  });
};

/**
 * Specific hook for group management - all groups
 */
export const useManageGroups = (gameMode?: string, locale?: string) => {
  return useContextualGroups('manage', gameMode, {
    includeTileCounts: true,
    includeDefaults: true,
    locale,
  });
};

/**
 * Reactive hook for tile editor - all groups for selection using Dexie's useLiveQuery
 * Automatically detects database changes without manual refresh triggers
 */
export const useEditorGroupsReactive = (gameMode: string, locale?: string) => {
  const resolvedLocale = locale || i18next.resolvedLanguage || i18next.language || 'en';

  // Use Dexie's useLiveQuery to automatically detect database changes
  const groups = useLiveQuery(
    () =>
      getCustomGroups({
        locale: resolvedLocale,
        gameMode,
        // Don't filter by isDefault - include all groups for editor context
      }),
    [resolvedLocale, gameMode]
  );

  const groupsWithMetadata = useMemo(() => {
    if (!groups) return [];

    return groups.map((group) => ({
      ...group,
      hasNoTiles: false, // For editor context, we don't need tile counts
      isAvailableForSetup: true,
    }));
  }, [groups]);

  return {
    groups: groupsWithMetadata,
    loading: groups === undefined,
    error: null,
    isEmpty: groups ? groups.length === 0 : true,
  };
};

/**
 * Specific hook for tile editor - all groups for selection
 * @deprecated Use useEditorGroupsReactive instead for automatic database change detection
 */
export const useEditorGroups = (gameMode: string, locale?: string, refreshTrigger?: number) => {
  return useContextualGroups('editor', gameMode, {
    includeDefaults: true,
    locale,
    refreshTrigger,
  });
};

/**
 * Performance-optimized hook with caching
 */
export const useCachedGroups = (
  context: GroupFilterContext,
  gameMode?: string,
  cacheTime = 300000 // 5 minutes
) => {
  const [cache, setCache] = useState<
    Map<
      string,
      {
        data: GroupWithTileInfo[];
        timestamp: number;
      }
    >
  >(new Map());

  const cacheKey = `${context}-${gameMode || 'online'}-${i18next.resolvedLanguage || 'en'}`;

  const result = useContextualGroups(context, gameMode, { includeTileCounts: true });

  useEffect(() => {
    if (!result.loading && result.groups.length > 0) {
      setCache(
        (prev) =>
          new Map(
            prev.set(cacheKey, {
              data: result.groups,
              timestamp: Date.now(),
            })
          )
      );
    }
  }, [result.groups, result.loading, cacheKey]);

  // Check cache first
  const cachedData = cache.get(cacheKey);
  const isCacheValid = cachedData && Date.now() - cachedData.timestamp < cacheTime;

  if (isCacheValid && !result.loading) {
    return {
      ...result,
      groups: cachedData.data,
      fromCache: true,
    };
  }

  return {
    ...result,
    fromCache: false,
  };
};
