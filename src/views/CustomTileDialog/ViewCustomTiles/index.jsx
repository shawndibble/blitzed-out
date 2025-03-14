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
  FormControl,
} from '@mui/material';
import TileCategorySelection from '@/Components/TileCategorySelection';
import { useState, useEffect } from 'react';
import {
  deleteCustomTile,
  toggleCustomTile,
  getTiles,
  getCustomTileGroups,
} from '@/stores/customTiles';
import { Trans } from 'react-i18next';
import { useTranslation } from 'react-i18next';
import useGameSettings from '@/hooks/useGameSettings';
import groupActionsFolder from '@/helpers/actionsFolder';

export default function ViewCustomTiles({
  tagList,
  boardUpdated,
  mappedGroups,
  updateTile,
  refreshTrigger,
}) {
  const { t, i18n } = useTranslation();
  const { settings } = useGameSettings();
  const [tagFilter, setTagFilter] = useState(null);
  const [gameModeFilter, setGameModeFilter] = useState(settings.gameMode || 'online');
  const [groupFilter, setGroupFilter] = useState('');
  const [intensityFilter, setIntensityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20); // Number of items per page
  const [loading, setLoading] = useState(true);
  const [tiles, setTiles] = useState({ items: [], total: 0, totalPages: 1 });
  const [groups, setGroups] = useState({});
  const [uniqueGroups, setUniqueGroups] = useState([]);

  // Load groups on initial render
  useEffect(() => {
    async function loadGroups() {
      try {
        setLoading(true);
        const groupData = await getCustomTileGroups(i18n.resolvedLanguage, gameModeFilter);
        setGroups(groupData);

        // Extract unique groups
        const groupNames = Object.keys(groupData);
        setUniqueGroups(groupNames);

        // Set default group filter if not already set
        if (!groupFilter && groupNames.length > 0) {
          setGroupFilter(groupNames[0]);

          // Set default intensity if available
          const intensities = Object.keys(groupData[groupNames[0]]?.intensities || {});
          if (intensities.length > 0) {
            setIntensityFilter(Number(intensities[0]));
          }
        }
      } catch (error) {
        console.error('Error loading groups:', error);
      } finally {
        setLoading(false);
      }
    }

    loadGroups();
  }, [gameModeFilter, i18n.resolvedLanguage]);

  // Load tiles when filters change
  useEffect(() => {
    let isMounted = true;

    async function loadTiles() {
      try {
        setLoading(true);
        const filters = {
          group: groupFilter,
          intensity: intensityFilter,
          tag: tagFilter,
          gameMode: gameModeFilter,
          locale: settings.locale,
          page,
          limit,
          paginated: true,
        };

        const tileData = await getTiles(filters);

        // Only update state if component is still mounted
        if (isMounted) {
          setTiles(tileData);
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

  function toggleTagFilter(tag) {
    setLoading(true);
    if (tagFilter === tag) {
      setTagFilter(null);
    } else {
      setTagFilter(tag);
    }
  }

  function handleGroupFilterChange(event) {
    // Set loading first for smoother transition
    setLoading(true);

    const newGroup = event.target.value;
    setGroupFilter(newGroup);
    setPage(1); // Reset to first page

    // Reset intensity filter when group changes
    setIntensityFilter('');

    // If a group is selected, set intensity to the first available intensity for that group
    if (newGroup && groups[newGroup]) {
      const intensities = Object.keys(groups[newGroup].intensities || {});
      if (intensities.length > 0) {
        setIntensityFilter(Number(intensities[0]));
      }
    }
  }

  function handleIntensityFilterChange(event) {
    // Set loading first for smoother transition
    setLoading(true);

    setIntensityFilter(event.target.value);
    setPage(1); // Reset to first page
  }

  function handlePageChange(event, newPage) {
    setLoading(true);
    setPage(newPage);
  }

  async function deleteTile(index) {
    await deleteCustomTile(index);
    boardUpdated();
    // Refresh the current page
    const filters = {
      group: groupFilter,
      intensity: intensityFilter,
      tag: tagFilter,
      gameMode: gameModeFilter,
      locale: settings.locale,
      page,
      limit,
      paginated: true,
    };
    const tileData = await getTiles(filters);
    setTiles(tileData);
  }

  async function toggleTile(id) {
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

  function handleUpdateTile(id) {
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
          titleTypographyProps={{ variant: 'body1' }}
          subheader={
            groupActionsFolder(mappedGroups[gameModeFilter] || {})?.find(
              ({ value, intensity: inten }) => value === group && inten === Number(intensity)
            )?.label
          }
          subheaderTypographyProps={{ variant: 'body2' }}
          action={
            <>
              <Switch
                checked={!!isEnabled}
                onChange={() => toggleTile(id)}
                inputProps={{ 'aria-label': t('customTiles.toggleTile') }}
              />
              {!!isCustom && (
                <>
                  <IconButton
                    aria-label={t('customTiles.update')}
                    onClick={() => handleUpdateTile(id)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton aria-label={t('customTiles.delete')} onClick={() => deleteTile(id)}>
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
            <Chip key={tag} label={tag} sx={{ m: 0.5 }} />
          ))}
        </CardActions>
      </Card>
    )
  );

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          mb: 2,
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <TileCategorySelection
          gameMode={gameModeFilter}
          groupFilter={groupFilter}
          intensityFilter={intensityFilter}
          groups={groups}
          mappedGroups={mappedGroups}
          onGameModeChange={(value) => {
            setGameModeFilter(value);
            setGroupFilter('');
            setIntensityFilter('');
            setPage(1);
          }}
          onGroupChange={(value) => {
            setGroupFilter(value);
            setPage(1);
          }}
          onIntensityChange={(value) => {
            setIntensityFilter(value);
            setPage(1);
          }}
        />

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
