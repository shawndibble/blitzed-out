import { Delete, Edit } from '@mui/icons-material';
import {
  Box,
  Card,
  CardActions,
  CardHeader,
  Chip,
  IconButton,
  Switch,
  Pagination,
  Typography,
  CircularProgress,
  Fade,
} from '@mui/material';
import TileCategorySelection from '@/components/TileCategorySelection';
import { useState, useEffect } from 'react';
import {
  deleteCustomTile,
  toggleCustomTile,
  getCustomTileGroups,
  getPaginatedTiles,
} from '@/stores/customTiles';
import { Trans } from 'react-i18next';
import { useTranslation } from 'react-i18next';
import useGameSettings from '@/hooks/useGameSettings';
import groupActionsFolder from '@/helpers/actionsFolder';
import { ViewCustomTilesProps } from '@/types/customTiles';
import { TileData } from '@/types/viewCustomTiles';
import { CustomTileGroups } from '@/types/dexieTypes';

export default function ViewCustomTiles({
  tagList,
  boardUpdated,
  mappedGroups,
  updateTile,
  refreshTrigger,
}: ViewCustomTilesProps) {
  const { t, i18n } = useTranslation();
  const { settings } = useGameSettings();
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [gameModeFilter, setGameModeFilter] = useState<string>(settings.gameMode || 'online');
  const [groupFilter, setGroupFilter] = useState<string>('');
  const [intensityFilter, setIntensityFilter] = useState<string | number>('');
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [tiles, setTiles] = useState<TileData>({ items: [], total: 0, totalPages: 1 });
  const [groups, setGroups] = useState<CustomTileGroups>({});

  const limit = 10;

  // Load groups on initial render
  useEffect(() => {
    async function loadGroups() {
      try {
        setLoading(true);
        const groupData = await getCustomTileGroups(
          i18n.resolvedLanguage,
          gameModeFilter,
          tagFilter
        );
        setGroups(groupData);

        // Extract unique groups
        const groupNames = Object.keys(groupData);

        // Check if current groupFilter is valid in the new list
        const isCurrentGroupValid = groupNames.includes(groupFilter);

        // Set default group filter if not already set or if current is invalid
        if ((!groupFilter || !isCurrentGroupValid) && groupNames.length > 0) {
          setGroupFilter(groupNames[0]);
          setIntensityFilter('all');
        } else if (isCurrentGroupValid && intensityFilter !== 'all') {
          // Verify intensity is valid for this group
          const validIntensities = Object.keys(groupData[groupFilter]?.intensities || {});
          if (!validIntensities.includes(String(intensityFilter))) {
            setIntensityFilter('all');
          }
        }
      } catch (error) {
        console.error('Error loading groups:', error);
      } finally {
        setLoading(false);
      }
    }

    loadGroups();
  }, [gameModeFilter, i18n.resolvedLanguage, tagFilter, groupFilter, intensityFilter]);

  // Load tiles when filters change
  useEffect(() => {
    let isMounted = true;

    async function loadTiles() {
      try {
        setLoading(true);
        const filters = {
          group: groupFilter,
          intensity: intensityFilter === 'all' ? null : Number(intensityFilter), // Send empty string for 'all'
          tag: tagFilter,
          gameMode: gameModeFilter,
          locale: settings.locale,
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

    // Only load if we have a group filter
    if (groupFilter) {
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
    const filters = {
      group: groupFilter,
      intensity: intensityFilter === 'all' ? null : intensityFilter, // Send empty string for 'all'
      tag: tagFilter,
      gameMode: gameModeFilter,
      locale: settings.locale,
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

  const tileList = tiles.items?.map(
    ({ id, group, intensity, action, tags, isEnabled = true, isCustom = true }) => (
      <Card sx={{ my: 2 }} key={id}>
        <CardHeader
          title={action}
          slotProps={{
            title: { variant: 'body1' },
            subheader: { variant: 'body2' },
            action: { 'aria-label': t('customTiles.actions') },
          }}
          subheader={
            mappedGroups?.[gameModeFilter as keyof typeof mappedGroups] &&
            Array.isArray(
              groupActionsFolder(mappedGroups[gameModeFilter as keyof typeof mappedGroups])
            )
              ? groupActionsFolder(mappedGroups[gameModeFilter as keyof typeof mappedGroups]).find(
                  ({ value, intensity: inten }) => value === group && inten === Number(intensity)
                )?.label
              : `${group} - Level ${intensity}`
          }
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
          {tags?.map((tag) => <Chip key={tag} label={tag} sx={{ m: 0.5 }} />)}
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
          onGameModeChange={(value: string) => {
            setGameModeFilter(value);
            setGroupFilter('');
            setIntensityFilter('');
            setPage(1);
          }}
          onGroupChange={(value: string) => {
            setGroupFilter(value);
            setPage(1);
          }}
          onIntensityChange={(value: string | number) => {
            setIntensityFilter(value);
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
          {tiles.items.length === 0 ? (
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
                  values={{ shown: tiles.items.length, total: tiles.total }}
                >
                  Showing {{ shown: tiles.items.length }} of {{ total: tiles.total }} tiles
                </Trans>
              </Typography>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
