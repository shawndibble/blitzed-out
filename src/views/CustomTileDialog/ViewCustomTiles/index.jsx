import { Delete, Edit } from '@mui/icons-material';
import { Box, Card, CardActions, CardHeader, Chip, IconButton, Switch, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useState, useEffect } from 'react';
import { deleteCustomTile, toggleCustomTile } from '@/stores/customTiles';

export default function ViewCustomTiles({
  tagList,
  customTiles,
  boardUpdated,
  mappedGroups,
  updateTile,
}) {
  const [tagFilter, setTagFilter] = useState(null);
  const [groupFilter, setGroupFilter] = useState('');
  const [uniqueGroups, setUniqueGroups] = useState([]);

  // Extract unique groups from custom tiles
  useEffect(() => {
    if (customTiles?.length) {
      const groups = [...new Set(customTiles.map(tile => tile.group))];
      setUniqueGroups(groups);
      
      // Set default group filter to first group if not already set
      if (!groupFilter && groups.length) {
        setGroupFilter(groups[0]);
      }
    }
  }, [customTiles, groupFilter]);

  function toggleTagFilter(tag) {
    if (tagFilter === tag) {
      return setTagFilter(null);
    }
    return setTagFilter(tag);
  }

  function handleGroupFilterChange(event) {
    setGroupFilter(event.target.value);
  }

  function deleteTile(index) {
    deleteCustomTile(index);
    boardUpdated();
  }

  function toggleTile(id) {
    toggleCustomTile(id);
    boardUpdated();
  }

  const tileList = customTiles
    ?.filter(({ tags, group }) => 
      (!tagFilter || tags?.includes(tagFilter)) && 
      (!groupFilter || group === groupFilter)
    )
    ?.sort((a, b) => `${b.group} - ${b.intensity}` - `${a.group} - ${a.intensity}`)
    ?.map(({ id, group, intensity, action, tags, isEnabled = true }) => (
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
                inputProps={{ 'aria-label': 'toggle tile' }}
              />
              <IconButton aria-label="update" onClick={() => updateTile(id)}>
                <Edit />
              </IconButton>
              <IconButton aria-label="delete" onClick={() => deleteTile(id)}>
                <Delete />
              </IconButton>
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
    ));

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="group-filter-label">Filter by Group</InputLabel>
          <Select
            labelId="group-filter-label"
            id="group-filter"
            value={groupFilter}
            label="Filter by Group"
            onChange={handleGroupFilterChange}
          >
            <MenuItem value="">All Groups</MenuItem>
            {uniqueGroups.map((group) => (
              <MenuItem key={group} value={group}>
                {mappedGroups.find(g => g.value === group)?.label || group}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
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
      {tileList}
    </Box>
  );
}
