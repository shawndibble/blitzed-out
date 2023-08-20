import {
  Box, FormControl, InputLabel, MenuItem, Select, Typography,
} from '@mui/material';

export default function GameSpeed({ formData, setFormData }) {
  const diceRollAverage = {
    '1d4': 2.5,
    '1d6': 3.5,
    '2d4': 5,
  };

  const rollAverage = formData?.roomTileCount
    ? Math.floor(formData.roomTileCount / diceRollAverage[formData.roomDice])
    : 16;

  const tileMenuItem = Array.from({ length: 7 }, (_, i) => (i + 2) * 10).map((tileCount) => (
    <MenuItem key={tileCount} value={tileCount}>{tileCount}</MenuItem>
  ));

  return (
    <>
      <Typography>Game Speed</Typography>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <FormControl sx={{ m: 1 }}>
          <InputLabel id="diceRole-label">Dice</InputLabel>
          <Select
            labelId="diceRole-label"
            id="diceRole-select"
            value={formData?.roomDice || '1d4'}
            label="Dice"
            onChange={(event) => setFormData({
              ...formData, roomDice: event.target.value, roomUpdated: true,
            })}
          >
            <MenuItem value="1d4">1d4</MenuItem>
            <MenuItem value="1d6">1d6</MenuItem>
            <MenuItem value="2d4">2d4</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ m: 1 }}>
          <InputLabel id="tile-count-label">Tiles</InputLabel>
          <Select
            labelId="tile-count-label"
            id="tile-count-select"
            value={formData?.roomTileCount || 40}
            label="Tiles"
            onChange={(event) => setFormData({
              ...formData, roomTileCount: event.target.value, roomUpdated: true,
            })}
          >
            {tileMenuItem}
          </Select>
        </FormControl>
        <Typography>
          Average rolls per game:
          {' '}
          {rollAverage}
        </Typography>
      </Box>
    </>
  );
}
