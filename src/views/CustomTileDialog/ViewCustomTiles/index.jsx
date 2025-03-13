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
  const [intensityFilter, setIntensityFilter] = useState('');
  
  // Set default filters when component loads
  useEffect(() => {
    if (customTiles?.length && mappedGroups?.length && !groupFilter) {
      // Get the first group from mappedGroups
      const firstGroup = mappedGroups[0]?.value || '';
      setGroupFilter(firstGroup);
      
      // Find intensities for this group
      const intensitiesForGroup = mappedGroups
        .filter(item => item.value === firstGroup)
        .map(item => item.intensity);
      
      // Set first intensity if available
      if (intensitiesForGroup.length > 0) {
        setIntensityFilter(intensitiesForGroup[0]);
      }
    }
  }, [customTiles, mappedGroups, groupFilter]);

  function toggleTagFilter(tag) {
    if (tagFilter === tag) {
      return setTagFilter(null);
    }
    return setTagFilter(tag);
  }

  function handleGroupFilterChange(event) {
    const newGroup = event.target.value;
    setGroupFilter(newGroup);
    
    // Reset intensity filter when group changes
    setIntensityFilter('');
    
    // If a group is selected, set intensity to the first available intensity for that group
    if (newGroup) {
      const intensitiesForGroup = mappedGroups
        .filter(item => item.value === newGroup)
        .map(item => item.intensity);
      
      if (intensitiesForGroup.length > 0) {
        setIntensityFilter(intensitiesForGroup[0]);
      }
    }
  }
  
  function handleIntensityFilterChange(event) {
    setIntensityFilter(event.target.value);
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
    ?.filter(({ tags, group, intensity }) => 
      (!tagFilter || tags?.includes(tagFilter)) && 
      (!groupFilter || group === groupFilter) &&
      (!intensityFilter || Number(intensity) === Number(intensityFilter))
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="group-filter-label">Filter by Group</InputLabel>
            <Select
              labelId="group-filter-label"
              id="group-filter"
              value={groupFilter}
              label="Filter by Group"
              onChange={handleGroupFilterChange}
            >
              {/* Get unique groups from mappedGroups */}
              {Array.from(new Set(mappedGroups.map(g => g.value))).map((group) => (
                <MenuItem key={group} value={group}>
                  {mappedGroups.find(g => g.value === group)?.group || group}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth disabled={!groupFilter}>
            <InputLabel id="intensity-filter-label">Intensity Level</InputLabel>
            <Select
              labelId="intensity-filter-label"
              id="intensity-filter"
              value={intensityFilter}
              label="Intensity Level"
              onChange={handleIntensityFilterChange}
            >
              {/* Filter intensities based on selected group */}
              {mappedGroups
                .filter(g => g.value === groupFilter)
                .map((item) => (
                  <MenuItem key={item.intensity} value={item.intensity}>
                    {item.translatedIntensity || `Level ${item.intensity}`}
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
      {tileList}
    </Box>
  );
}
