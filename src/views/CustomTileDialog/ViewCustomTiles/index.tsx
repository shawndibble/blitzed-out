import {
  Box,
  Card,
  CardActions,
  CardHeader,
  Chip,
  CircularProgress,
  Fade,
  IconButton,
  Pagination,
  Switch,
  Typography,
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import {
  deleteCustomTile,
  getPaginatedTiles,
  getTileCountsByGroup,
  toggleCustomTile,
} from '@/stores/customTiles';
import { useEffect, useState } from 'react';

import { CustomGroupPull } from '@/types/customGroups';
import { CustomTileGroups } from '@/types/dexieTypes';
import TileCategorySelection from '@/components/TileCategorySelection';
import { TileData } from '@/types/viewCustomTiles';
import { Trans } from 'react-i18next';
import { ViewCustomTilesProps } from '@/types/customTiles';
import { getAllAvailableGroups } from '@/stores/customGroups';
import { useGameSettings } from '@/stores/settingsStore';
import { useTranslation } from 'react-i18next';

export default function ViewCustomTiles({
  tagList,
  boardUpdated,
  mappedGroups,
  updateTile,
  refreshTrigger,
  sharedFilters,
  setSharedFilters,
}: ViewCustomTilesProps) {
  const { t, i18n } = useTranslation();
  const { settings } = useGameSettings();
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  // Use shared filters instead of individual state
  const gameModeFilter = sharedFilters.gameMode;
  const groupFilter = sharedFilters.groupName;
  const intensityFilter = sharedFilters.intensity || 'all'; // Default to 'all' when empty

  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [tiles, setTiles] = useState<TileData>({ items: [], total: 0, totalPages: 1 });
  const [groups, setGroups] = useState<CustomTileGroups>({});
  const [dexieGroups, setDexieGroups] = useState<Record<string, CustomGroupPull>>({});

  const limit = 10;

  // Load groups and tile counts on initial render
  useEffect(() => {
    async function loadGroupsAndCounts() {
      try {
        setLoading(true);

        // Execute both async operations concurrently
        const [allGroups, tileCounts] = await Promise.all([
          getAllAvailableGroups(i18n.resolvedLanguage, gameModeFilter),
          getTileCountsByGroup(i18n.resolvedLanguage, gameModeFilter, tagFilter),
        ]);

        // Also set dexieGroups for TileCategorySelection component
        const groupMap: Record<string, CustomGroupPull> = {};
        allGroups.forEach((group) => {
          groupMap[group.name] = group;
        });
        setDexieGroups(groupMap);

        // Merge group definitions with tile counts
        const groupData: CustomTileGroups = {};
        allGroups.forEach((group) => {
          // Check both group.id and group.name since tiles might be stored with either
          const counts = tileCounts[group.id] ||
            tileCounts[group.name] || { count: 0, intensities: {} };
          groupData[group.name] = {
            label: group.label || group.name,
            count: counts.count,
            intensities: counts.intensities,
          };
        });

        setGroups(groupData);

        // Extract group names from all available groups (not just those with tiles)
        const groupNames = allGroups.map((group) => group.name);

        // Check if current groupFilter (groupName) is valid in the new list
        const isCurrentGroupValid = groupNames.includes(groupFilter);

        // Set default group filter if not already set or if current is invalid
        if ((!groupFilter || !isCurrentGroupValid) && groupNames.length > 0) {
          setSharedFilters({
            ...sharedFilters,
            groupName: groupNames[0],
            intensity: '', // Empty string for 'all' in AddCustomTile
          });
        } else if (isCurrentGroupValid && intensityFilter !== 'all') {
          // Verify intensity is valid for this group - use the group definition, not tile data
          const selectedGroup = allGroups.find((g) => g.name === groupFilter);
          if (selectedGroup) {
            const validIntensityValues = selectedGroup.intensities.map((i) => i.value);
            if (!validIntensityValues.includes(Number(intensityFilter))) {
              setSharedFilters({
                ...sharedFilters,
                intensity: '', // Empty string for 'all' in AddCustomTile
              });
            }
          }
        }
      } catch (error) {
        console.error('Error loading groups and counts:', error);
      } finally {
        setLoading(false);
      }
    }

    loadGroupsAndCounts();
  }, [
    gameModeFilter,
    i18n.resolvedLanguage,
    tagFilter,
    groupFilter,
    intensityFilter,
    setSharedFilters,
    sharedFilters,
  ]);

  // Load tiles when filters change
  useEffect(() => {
    let isMounted = true;

    async function loadTiles() {
      try {
        setLoading(true);
        // Convert group name to group ID for filtering
        const groupId = dexieGroups[groupFilter]?.id || groupFilter;

        // Apply server-side filtering for proper pagination
        const intensityValue =
          intensityFilter === 'all' || intensityFilter === '' ? null : intensityFilter;

        const filters = {
          group: groupId,
          tag: tagFilter,
          intensity: intensityValue,
          page,
          limit,
          paginated: true,
        };

        const tileData = await getPaginatedTiles(filters);

        // Only update state if component is still mounted
        if (isMounted) {
          setTiles(tileData as unknown as TileData);
          // Add a small delay before removing loading state for smoother transitions
          setTimeout(() => {
            if (isMounted) {
              setLoading(false);
            }
          }, 300);
        }
      } catch (error) {
        console.error('Error loading tiles:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    // Only load if we have a group filter and groups are loaded
    if (groupFilter && Object.keys(dexieGroups).length > 0) {
      loadTiles();
    } else {
      setLoading(false);
    }

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [
    groupFilter,
    intensityFilter,
    tagFilter,
    gameModeFilter,
    page,
    limit,
    refreshTrigger,
    settings.locale,
    dexieGroups,
  ]);

  function toggleTagFilter(tag: string): void {
    setLoading(true);
    if (tagFilter === tag) {
      setTagFilter(null);
    } else {
      setTagFilter(tag);
    }
  }

  function handlePageChange(_: React.ChangeEvent<unknown>, newPage: number): void {
    setLoading(true);
    setPage(newPage);
  }

  async function deleteTile(index: number): Promise<void> {
    await deleteCustomTile(index);
    boardUpdated();
    // Refresh the current page
    const groupId = dexieGroups[groupFilter]?.id || groupFilter;
    const filters = {
      group: groupId,
      tag: tagFilter,
      intensity: intensityFilter === 'all' || intensityFilter === '' ? null : intensityFilter,
      page,
      limit,
      paginated: true,
    };
    const tileData = await getPaginatedTiles(filters);
    setTiles(tileData as unknown as TileData);
  }

  async function toggleTile(id: number): Promise<void> {
    await toggleCustomTile(id);
    boardUpdated();
    // Update the tile in the current list without reloading
    setTiles((prev) => ({
      ...prev,
      items: prev.items.map((tile) =>
        tile.id === id ? { ...tile, isEnabled: !tile.isEnabled } : tile
      ),
    }));
  }

  function handleUpdateTile(id: number): void {
    updateTile(id);
    // Scroll to the top of the dialog where the AddCustomTile component is
    const dialogContent = document.querySelector('.MuiDialogContent-root');
    if (dialogContent) {
      dialogContent.scrollTop = 0;
    }
  }

  function getSubheaderText(groupId: string, intensity: number): string {
    // Find the group by ID first, then look up in dexieGroups by name
    const groupByIdEntry = Object.entries(dexieGroups).find(([_, group]) => group.id === groupId);

    if (groupByIdEntry) {
      const [groupName, dexieGroup] = groupByIdEntry;
      // Get the group label
      const groupLabel = dexieGroup.label || groupName;

      // Find the intensity label
      const intensityData = dexieGroup.intensities.find((i) => i.value === Number(intensity));
      const intensityLabel = intensityData?.label || `Level ${Number(intensity) + 1}`;

      return `${groupLabel} - ${intensityLabel}`;
    }

    // Fallback if group not found
    return `Unknown Group - Level ${Number(intensity) + 1}`;
  }

  // No need for client-side filtering - server handles it now
  const tileList = tiles.items?.map(
    ({ id, group_id, intensity, action, tags, isEnabled = true, isCustom = true }) => (
      <Card sx={{ my: 2 }} key={id}>
        <CardHeader
          title={action}
          slotProps={{
            title: { variant: 'body1' },
            subheader: { variant: 'body2' },
            action: { 'aria-label': t('customTiles.actions') },
          }}
          subheader={getSubheaderText(group_id || '', intensity)}
          action={
            <>
              <Switch
                checked={!!isEnabled}
                onChange={() => id !== undefined && toggleTile(id)}
                slotProps={{ input: { 'aria-label': t('customTiles.toggleTile') } }}
              />
              {!!isCustom && (
                <>
                  <IconButton
                    onClick={() => id !== undefined && handleUpdateTile(id)}
                    aria-label={t('customTiles.update')}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() => id !== undefined && deleteTile(id)}
                    aria-label={t('customTiles.delete')}
                  >
                    <Delete />
                  </IconButton>
                </>
              )}
            </>
          }
          sx={{ pb: 0 }}
        />
        <CardActions>
          {tags?.map((tag) => (
            <Chip key={tag} label={tag === 'default' ? t('default') : tag} sx={{ m: 0.5 }} />
          ))}
        </CardActions>
      </Card>
    )
  );

  return (
    <Box>
      <Box>
        {tagList?.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            sx={{ m: 0.5 }}
            color={tagFilter === tag ? 'primary' : 'default'}
            onClick={() => toggleTagFilter(tag)}
          />
        ))}
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          my: 2,
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <TileCategorySelection
          gameMode={gameModeFilter}
          groupFilter={groupFilter}
          intensityFilter={intensityFilter}
          groups={groups}
          mappedGroups={mappedGroups}
          dexieGroups={dexieGroups}
          onGameModeChange={(value: string) => {
            const newFilters = {
              gameMode: value,
              groupName: '',
              intensity: '',
            };
            setSharedFilters(newFilters);
            setPage(1);
          }}
          onGroupChange={(value: string) => {
            const newFilters = {
              ...sharedFilters,
              groupName: value,
              intensity: '', // Reset intensity when group changes
            };
            setSharedFilters(newFilters);
            setPage(1);
          }}
          onIntensityChange={(value: string | number) => {
            setSharedFilters({
              ...sharedFilters,
              intensity: value === 'all' ? '' : value.toString(), // Convert 'all' to empty string for AddCustomTile
            });
            setPage(1);
          }}
        />
      </Box>

      <Box sx={{ position: 'relative', minHeight: '200px' }}>
        {/* Loading overlay */}
        <Fade in={loading} timeout={300}>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0)',
              zIndex: 1,
              borderRadius: 1,
            }}
          >
            <CircularProgress />
          </Box>
        </Fade>

        {/* Content area with consistent height */}
        <Box
          sx={{
            opacity: loading ? 0.3 : 1,
            transition: 'opacity 0.3s ease-in-out',
            pointerEvents: loading ? 'none' : 'auto',
          }}
        >
          {tiles.items?.length === 0 ? (
            <Typography variant="body1" sx={{ textAlign: 'center', my: 4 }}>
              <Trans i18nKey="customTiles.noTilesFound">
                No tiles found with the selected filters.
              </Trans>
            </Typography>
          ) : (
            <>
              {tileList}

              {/* Pagination */}
              {tiles.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
                  <Pagination
                    count={tiles.totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              )}

              <Typography
                variant="body2"
                sx={{ textAlign: 'center', mt: 2, color: 'text.secondary' }}
              >
                <Trans
                  i18nKey="customTiles.showingTiles"
                  values={{ shown: tiles.items?.length || 0, total: tiles.total }}
                >
                  Showing {{ shown: tiles.items?.length || 0 }} of {{ total: tiles.total }} tiles
                </Trans>
              </Typography>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
