import { currentLocale } from '@/services/locale';
import { getCustomGroups } from '@/stores/customGroups';
import { useMemo } from 'react';

import { useLiveQuery } from 'dexie-react-hooks';

/**
 * Reactive hook for tile editor - all groups for selection using Dexie's useLiveQuery
 * Automatically detects database changes without manual refresh triggers
 */
export const useEditorGroupsReactive = (gameMode: string, locale?: string) => {
  const resolvedLocale = locale || currentLocale();

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
