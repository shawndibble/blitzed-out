import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllAvailableGroups, getGroupsWithTiles } from '@/stores/customGroups';
import { getTileCountsByGroup } from '@/stores/customTiles';
import { GroupedActions } from '@/types/customTiles';
import { DEFAULT_NONE_OPTION } from '@/constants/actionConstants';

interface UnifiedActionListResult {
  actionsList: GroupedActions;
  isLoading: boolean;
}

/**
 * Simplified hook that provides a unified actions list from custom groups
 *
 * @param gameMode - The game mode to filter groups by (e.g., 'online', 'local')
 * @param showOnlyGroupsWithTiles - Whether to only show groups that have tiles
 * @param refreshKey - Value that can be toggled (e.g., boolean or counter) to force reload
 * @returns Object containing the unified actions list and loading state
 */
export default function useUnifiedActionList(
  gameMode?: string,
  showOnlyGroupsWithTiles: boolean = false,
  refreshKey?: unknown
): UnifiedActionListResult {
  const { i18n } = useTranslation();
  const [actionsList, setActionsList] = useState<GroupedActions>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    const loadUnifiedActions = async (): Promise<void> => {
      if (!gameMode) {
        if (!cancelled) {
          setActionsList({});
          setIsLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setIsLoading(true);
      }

      try {
        const locale = i18n.resolvedLanguage || 'en';
        let allGroups;

        // Get groups based on filtering preference
        if (showOnlyGroupsWithTiles) {
          allGroups = await getGroupsWithTiles(gameMode);

          // Get tile counts for intensity filtering
          const tileCounts = await getTileCountsByGroup(locale, gameMode, null);

          // Filter intensities to only show those with tiles
          allGroups = allGroups.map((group) => {
            if (tileCounts?.[group.id]?.intensities) {
              const availableIntensityValues = Object.keys(tileCounts[group.id].intensities).map(
                Number
              );
              const filteredIntensities =
                group.intensities?.filter((intensity) =>
                  availableIntensityValues.includes(intensity.value)
                ) || [];

              return { ...group, intensities: filteredIntensities };
            }
            return group;
          });
        } else {
          allGroups = await getAllAvailableGroups(locale, gameMode);
        }

        // Convert groups to unified actions structure
        const unifiedActions: GroupedActions = {};

        for (const group of allGroups) {
          const actions: Record<string, string[]> = {
            [DEFAULT_NONE_OPTION]: [],
          };

          const intensities: Record<number, string> = {};

          // Build intensities map from group data
          if (group.intensities && Array.isArray(group.intensities)) {
            group.intensities
              .sort((a, b) => a.value - b.value)
              .forEach((intensity) => {
                actions[intensity.label] = [];
                intensities[intensity.value] = intensity.label;
              });
          }

          // Ensure each group has a proper label for Quick Start display
          unifiedActions[group.name] = {
            label: group.label || group.name,
            type: group.type || 'action',
            actions,
            intensities,
          };
        }

        if (!cancelled) {
          setActionsList(unifiedActions);
        }
      } catch (error) {
        console.error('Error loading unified actions:', {
          error,
          locale: i18n.resolvedLanguage,
          gameMode,
          showOnlyGroupsWithTiles,
        });

        // Set empty object on error to prevent UI breaks
        if (!cancelled) {
          setActionsList({});
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadUnifiedActions();

    return () => {
      cancelled = true;
    };
  }, [gameMode, i18n.resolvedLanguage, showOnlyGroupsWithTiles, refreshKey]);

  return { actionsList, isLoading };
}
