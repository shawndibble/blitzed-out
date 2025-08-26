/**
 * Custom hook for managing group data operations
 */
import { useState, useCallback, useEffect } from 'react';
import { getCustomGroups, deleteCustomGroup } from '@/stores/customGroups';
import { countTilesByGroup, deleteCustomTilesByGroup } from '@/stores/customTiles';
import type { CustomGroupPull } from '@/types/customGroups';

interface GroupDataState {
  existingGroups: CustomGroupPull[];
  tileCounts: Record<string, number>;
  loadingGroups: boolean;
  deleteDialogOpen: boolean;
  pendingDeleteGroup: {
    id: string;
    name: string;
    tileCount: number;
  } | null;
}

interface GroupDataActions {
  reloadGroupsAndCounts: () => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  openDeleteDialog: (group: CustomGroupPull, tileCount: number) => void;
  closeDeleteDialog: () => void;
  setLoadingGroups: (loading: boolean) => void;
}

export function useGroupData(locale: string): [GroupDataState, GroupDataActions] {
  const [existingGroups, setExistingGroups] = useState<CustomGroupPull[]>([]);
  const [tileCounts, setTileCounts] = useState<Record<string, number>>({});
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteGroup, setPendingDeleteGroup] = useState<{
    id: string;
    name: string;
    tileCount: number;
  } | null>(null);

  // Load groups and tile counts
  const reloadGroupsAndCounts = useCallback(async () => {
    try {
      setLoadingGroups(true);

      // Get all custom groups (not default ones) regardless of game mode
      const customGroups = await getCustomGroups({
        locale,
        isDefault: false,
      });
      setExistingGroups(customGroups);

      // Load tile counts for each custom group across all game modes
      const counts: Record<string, number> = {};
      await Promise.all(
        customGroups.map(async (group) => {
          // Count tiles for this group across both online and local modes
          const onlineCount = await countTilesByGroup(group.name, locale, 'online');
          const localCount = await countTilesByGroup(group.name, locale, 'local');
          counts[group.id] = onlineCount + localCount;
        })
      );
      setTileCounts(counts);
    } catch (error) {
      console.error('Error reloading groups:', error);
    } finally {
      setLoadingGroups(false);
    }
  }, [locale]);

  // Delete a group and its associated tiles
  const deleteGroup = useCallback(
    async (groupId: string) => {
      if (!pendingDeleteGroup) return;

      try {
        // Delete all tiles associated with this group first
        await deleteCustomTilesByGroup(pendingDeleteGroup.name);

        // Then delete the group itself
        await deleteCustomGroup(groupId);

        // Reload the groups list
        await reloadGroupsAndCounts();

        // Close the delete dialog
        setDeleteDialogOpen(false);
        setPendingDeleteGroup(null);
      } catch (error) {
        console.error('Error deleting group:', error);
      }
    },
    [pendingDeleteGroup, reloadGroupsAndCounts]
  );

  // Open delete confirmation dialog
  const openDeleteDialog = useCallback((group: CustomGroupPull, tileCount: number) => {
    setPendingDeleteGroup({
      id: group.id,
      name: group.name,
      tileCount,
    });
    setDeleteDialogOpen(true);
  }, []);

  // Close delete confirmation dialog
  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setPendingDeleteGroup(null);
  }, []);

  // Load data on mount and when locale changes
  useEffect(() => {
    reloadGroupsAndCounts();
  }, [reloadGroupsAndCounts]);

  const state: GroupDataState = {
    existingGroups,
    tileCounts,
    loadingGroups,
    deleteDialogOpen,
    pendingDeleteGroup,
  };

  const actions: GroupDataActions = {
    reloadGroupsAndCounts,
    deleteGroup,
    openDeleteDialog,
    closeDeleteDialog,
    setLoadingGroups,
  };

  return [state, actions];
}
