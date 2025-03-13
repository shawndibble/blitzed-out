import { Delete, Edit } from '@mui/icons-material';
import {
  Box,
  Card,
  CardActions,
  CardHeader,
  Chip,
  IconButton,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useState, useEffect } from 'react';
import {
  deleteCustomTile,
  toggleCustomTile,
  getCustomTiles,
  getCustomTileGroups,
} from '@/stores/customTiles';
import { Trans } from 'react-i18next';
import { useTranslation } from 'react-i18next';

export default function ViewCustomTiles({ tagList, boardUpdated, mappedGroups, updateTile, refreshTrigger }) {
  const { t } = useTranslation();
  const [tagFilter, setTagFilter] = useState(null);
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
        const groupData = await getCustomTileGroups();
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
  }, []);

  // Load tiles when filters change
  useEffect(() => {
    async function loadTiles() {
      try {
        setLoading(true);
        const filters = {
          group: groupFilter,
          intensity: intensityFilter,
          tag: tagFilter,
          page,
          limit,
          paginated: true,
        };

        const tileData = await getCustomTiles(filters);
        setTiles(tileData);
      } catch (error) {
        console.error('Error loading tiles:', error);
      } finally {
        setLoading(false);
      }
    }

    // Only load if we have a group filter
    if (groupFilter) {
      loadTiles();
    }
  }, [groupFilter, intensityFilter, tagFilter, page, limit, refreshTrigger]);

  function toggleTagFilter(tag) {
    if (tagFilter === tag) {
      return setTagFilter(null);
    }
    return setTagFilter(tag);
  }

  function handleGroupFilterChange(event) {
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
    setIntensityFilter(event.target.value);
    setPage(1); // Reset to first page
  }

  function handlePageChange(event, newPage) {
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
      page,
      limit,
      paginated: true,
    };
    const tileData = await getCustomTiles(filters);
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
            mappedGroups.find(
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
                  <IconButton aria-label={t('customTiles.update')} onClick={() => handleUpdateTile(id)}>
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="group-filter-label">
              <Trans i18nKey="customTiles.filterByGroup">Filter by Group</Trans>
            </InputLabel>
            <Select
              labelId="group-filter-label"
              id="group-filter"
              value={groupFilter}
              label="Filter by Group"
              onChange={handleGroupFilterChange}
            >
              {uniqueGroups.map((group) => (
                <MenuItem key={group} value={group}>
                  {mappedGroups.find((g) => g.value === group)?.group || group}
                  {groups[group] && ` (${groups[group].count})`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={!groupFilter}>
            <InputLabel id="intensity-filter-label">
              <Trans i18nKey="customTiles.intensityLevel">Intensity Level</Trans>
            </InputLabel>
            <Select
              labelId="intensity-filter-label"
              id="intensity-filter"
              value={intensityFilter}
              label="Intensity Level"
              onChange={handleIntensityFilterChange}
            >
              {groupFilter &&
                groups[groupFilter] &&
                Object.entries(groups[groupFilter].intensities || {})
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([intensity, count]) => (
                    <MenuItem key={intensity} value={Number(intensity)}>
                      {mappedGroups.find(
                        (g) => g.value === groupFilter && g.intensity === Number(intensity)
                      )?.translatedIntensity || `Level ${intensity}`}
                      {` (${count})`}
                    </MenuItem>
                  ))}
            </Select>
          </FormControl>
        </Box>

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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : tiles.items.length === 0 ? (
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

          <Typography variant="body2" sx={{ textAlign: 'center', mt: 2, color: 'text.secondary' }}>
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
  );
}
