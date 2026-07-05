/**
 * Custom hook for managing group data operations
 */
import { useState, useCallback, useEffect } from 'react';
import { getCustomGroups } from '@/stores/customGroups';
import { deleteGroup as deleteContentGroup } from '@/stores/contentLibrary';
import { countTilesByGroupId } from '@/stores/customTiles';
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

      // Load tile counts per group id (ids are unique across modes, so a
      // single id-keyed count already covers online and local tiles)
      const counts: Record<string, number> = {};
      await Promise.all(
        customGroups.map(async (group) => {
          counts[group.id] = await countTilesByGroupId(group.id);
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

      const result = await deleteContentGroup(groupId, { cascadeDelete: true });
      if (!result.success) {
        console.error('Error deleting group:', result.error);
        return;
      }

      // Reload the groups list
      await reloadGroupsAndCounts();

      // Close the delete dialog
      setDeleteDialogOpen(false);
      setPendingDeleteGroup(null);
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
