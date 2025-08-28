import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllAvailableGroups, getCustomGroupsWithTiles } from '@/stores/customGroups';
import { getTileCountsByGroup } from '@/stores/customTiles';
import { GroupedActions } from '@/types/customTiles';
import { useMigration } from '@/context/migration';
import { DEFAULT_NONE_OPTION } from '@/constants/actionConstants';

interface UnifiedActionListResult {
  actionsList: GroupedActions;
  isLoading: boolean;
}

/**
 * Hook that combines default actions from locale files with custom groups from IndexedDB
 * into a unified structure that can be used by the existing IncrementalSelect component
 *
 * @param gameMode - The game mode to filter groups by (e.g., 'online', 'local')
 * @param showOnlyGroupsWithTiles - Whether to only show groups that have tiles (for board building contexts)
 * @returns Object containing the unified actions list and loading state
 *
 * Features:
 * - Automatically handles locale changes
 * - Filters groups by game mode
 * - Optionally filters to only show groups with tiles for board building contexts
 * - Converts custom groups to the expected format for UI components
 */
export default function useUnifiedActionList(
  gameMode?: string,
  showOnlyGroupsWithTiles: boolean = false
): UnifiedActionListResult {
  const { i18n } = useTranslation();
  const { currentLanguageMigrated, isHealthy, forceRecovery } = useMigration();
  const [actionsList, setActionsList] = useState<GroupedActions>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [recoveryAttempted, setRecoveryAttempted] = useState<boolean>(false);

  useEffect(() => {
    const loadUnifiedActions = async (): Promise<void> => {
      if (!gameMode) {
        console.warn('⚠️ useUnifiedActionList: Missing required params', { gameMode });
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

      setIsLoading(true);

      try {
        let allGroups;
        let tileCounts: Record<
          string,
          { count: number; intensities: Record<number, number> }
        > | null = null;

        if (showOnlyGroupsWithTiles) {
          // For board building contexts - only show groups with tiles
          const groupsWithCustomTiles = await getCustomGroupsWithTiles(
            i18n.resolvedLanguage,
            gameMode
          );
          tileCounts = await getTileCountsByGroup(i18n.resolvedLanguage, gameMode, null);

          // Get default groups that have tiles
          const allAvailableGroups = await getAllAvailableGroups(i18n.resolvedLanguage, gameMode);
          const defaultGroupsWithTiles = allAvailableGroups.filter(
            (group) => group.isDefault && tileCounts?.[group.name]
          );

          allGroups = [...groupsWithCustomTiles, ...defaultGroupsWithTiles];
        } else {
          // For management contexts - show all groups
          allGroups = await getAllAvailableGroups(i18n.resolvedLanguage, gameMode);
        }

        // Convert all groups to unified actions structure
        const unifiedActions: GroupedActions = {};

        for (const group of allGroups) {
          // Convert group to the same structure as expected by components
          const actions: Record<string, string[]> = {
            [DEFAULT_NONE_OPTION]: [], // Always include None option for consistency
          };

          // Add intensity levels as action keys with empty arrays
          // The IncrementalSelect component uses these keys as menu items
          const intensities: Record<number, string> = {};
          if (group.intensities && Array.isArray(group.intensities)) {
            let intensitiesToShow = group.intensities;

            // If we're filtering to only show groups with tiles, also filter intensities
            if (showOnlyGroupsWithTiles && tileCounts && tileCounts[group.name]?.intensities) {
              const availableIntensityValues = Object.keys(tileCounts[group.name].intensities).map(
                Number
              );
              intensitiesToShow = group.intensities.filter((intensity) =>
                availableIntensityValues.includes(intensity.value)
              );
            }

            intensitiesToShow
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

        setActionsList(unifiedActions);
      } catch (error) {
        console.error('❌ useUnifiedActionList: Error loading unified actions', {
          error,
          locale: i18n.resolvedLanguage,
          gameMode,
        });
        setActionsList({});
      } finally {
        setIsLoading(false);
      }
    };

    if (currentLanguageMigrated && gameMode) {
      loadUnifiedActions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMode, i18n.resolvedLanguage, currentLanguageMigrated, showOnlyGroupsWithTiles]);

  return { actionsList, isLoading };
}
