import { Delete, Edit } from '@mui/icons-material';
import { Box, Card, CardActions, CardHeader, Chip, IconButton, Switch } from '@mui/material';
import { useState } from 'react';
import { deleteCustomTile, toggleCustomTile } from '@/stores/customTiles';

export default function ViewCustomTiles({
  tagList,
  customTiles,
  boardUpdated,
  mappedGroups,
  updateTile,
}) {
  const [filter, setFilter] = useState(null);
  function toggleFilter(tag) {
    if (filter === tag) {
      return setFilter(null);
    }
    return setFilter(tag);
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
    ?.filter(({ tags }) => !filter || tags?.includes(filter))
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
      <Box>
        {tagList?.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            sx={{ m: 0.5 }}
            color={filter === tag ? 'primary' : 'default'}
            onClick={() => toggleFilter(tag)}
          />
        ))}
      </Box>
      {tileList}
    </Box>
  );
}
