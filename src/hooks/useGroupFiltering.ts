import { getCustomGroups, getGroupsWithTiles } from '@/stores/customGroups';
import { useEffect, useMemo, useState } from 'react';

import { CustomGroupPull } from '@/types/customGroups';
import { getTileCountsByGroup } from '@/stores/customTiles';
import i18next from 'i18next';
import { useLiveQuery } from 'dexie-react-hooks';

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
            groupsData = await getGroupsWithTiles(mode);
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
 * @deprecated Caching logic removed to comply with React hooks purity rules.
 * Use useContextualGroups directly instead.
 */
export const useCachedGroups = (
  context: GroupFilterContext,
  gameMode?: string,
  _cacheTime = 300000 // 5 minutes - unused but kept for API compatibility
) => {
  const result = useContextualGroups(context, gameMode, { includeTileCounts: true });

  // Simply return the result with fromCache flag set to false
  // Caching can be implemented at a higher level if needed
  return useMemo(
    () => ({
      ...result,
      fromCache: false,
    }),
    [result]
  );
};
