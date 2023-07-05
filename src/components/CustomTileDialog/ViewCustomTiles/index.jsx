import { Delete } from '@mui/icons-material';
import { Card, CardHeader, IconButton } from '@mui/material';

export default function ViewCustomTiles({ customTiles, setCustomTiles, boardUpdated }) {
  function deleteTile(index) {
    setCustomTiles([
      ...customTiles.slice(0, index),
      ...customTiles.slice(index + 1, customTiles.length),
    ]);
    boardUpdated();
  }

  const tileList = customTiles
    .sort((a, b) => `${b.group} - ${b.intensity}` - `${a.group} - ${a.intensity}`)
    .map(({ group, intensity, action }, index) => (
      <Card sx={{ my: 2 }} key={`${group}${intensity}${action}`}>
        <CardHeader
          title={action}
          titleTypographyProps={{ variant: 'body1' }}
          subheader={`${group} - ${intensity}`}
          subheaderTypographyProps={{ variant: 'body2' }}
          action={(
            <IconButton aria-label="delete" onClick={(event) => deleteTile(index, event)}>
              <Delete />
            </IconButton>
          )}
        />
      </Card>
    ));

  return (
    <div>{tileList}</div>
  );
}
