import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllAvailableGroups } from '@/stores/customGroups';
import { getGroupsWithTiles, getTileCountsByGroup } from '@/stores/contentLibrary';
import { deriveContentMode } from '@/stores/settingsStore';
import { GroupedActions } from '@/types/customTiles';

interface UnifiedActionListResult {
  actionsList: GroupedActions;
  isLoading: boolean;
  /**
   * The `gameMode` the current `actionsList` was loaded for, or undefined
   * before the first load settles.
   *
   * A consumer that reacts to a mode change cannot use `isLoading` alone:
   * `setIsLoading(true)` happens inside this hook's effect, so on the render
   * immediately after the mode changes, `isLoading` is still the previous
   * `false` while `actionsList` is still the previous mode's catalog. Compare
   * against this instead of guessing.
   */
  loadedGameMode?: string;
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
  const [loadedGameMode, setLoadedGameMode] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    const loadUnifiedActions = async (): Promise<void> => {
      if (!gameMode) {
        if (!cancelled) {
          setActionsList({});
          setLoadedGameMode(undefined);
          setIsLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setIsLoading(true);
      }

      try {
        const locale = i18n.resolvedLanguage || 'en';
        const contentGameMode = deriveContentMode(gameMode);
        let allGroups;
        // Which groups have tile text that names a {dom}/{sub} role, so the UI
        // can offer a role picker only where one would do something. Only the
        // tile-count query sees action text; this catalog never carries it.
        let roleTokenGroupIds = new Set<string>();

        // Get groups based on filtering preference
        if (showOnlyGroupsWithTiles) {
          allGroups = await getGroupsWithTiles(contentGameMode);

          // Get tile counts for intensity filtering
          const tileCounts = await getTileCountsByGroup(locale, contentGameMode, null);

          // Filter intensities to only show those with tiles
          roleTokenGroupIds = new Set(
            Object.entries(tileCounts ?? {})
              .filter(([, counts]) => counts.usesRoleTokens)
              .map(([groupId]) => groupId)
          );

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
          allGroups = await getAllAvailableGroups(locale, contentGameMode);
        }

        // Convert groups to unified actions structure
        const unifiedActions: GroupedActions = {};

        for (const group of allGroups) {
          const actions: Record<string, string[]> = {};

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
            usesRoleTokens: roleTokenGroupIds.has(group.id),
          };
        }

        if (!cancelled) {
          setActionsList(unifiedActions);
          setLoadedGameMode(gameMode);
        }
      } catch (error) {
        console.error('Error loading unified actions:', {
          error,
          locale: i18n.resolvedLanguage,
          gameMode,
          showOnlyGroupsWithTiles,
        });

        // Set empty object on error to prevent UI breaks. `loadedGameMode`
        // stays unset so consumers don't mistake a failed load for a real
        // catalog that happens to contain nothing.
        if (!cancelled) {
          setActionsList({});
          setLoadedGameMode(undefined);
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

  return { actionsList, isLoading, loadedGameMode };
}
