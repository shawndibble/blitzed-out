import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { Settings } from '@/types/Settings';

interface GameSpeedProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
}

interface DiceAverages {
  [key: string]: number;
}

export default function GameSpeed({ formData, setFormData }: GameSpeedProps): JSX.Element {
  const { t } = useTranslation();
  const diceRollAverage: DiceAverages = {
    '1d4': 2.5,
    '1d6': 3.5,
    '2d4': 5,
  };

  const rollAverage = formData?.roomTileCount
    ? Math.floor(formData.roomTileCount / diceRollAverage[formData.roomDice])
    : 16;

  const tileMenuItem = Array.from({ length: 7 }, (_, i) => (i + 2) * 10).map((tileCount) => (
    <MenuItem key={tileCount} value={tileCount}>
      {tileCount}
    </MenuItem>
  ));

  return (
    <>
      <Typography>
        <Trans i18nKey="gameSpeed" />
      </Typography>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <FormControl sx={{ m: 1 }} fullWidth>
          <InputLabel id="diceRole-label">
            <Trans i18nKey="roomDice" />
          </InputLabel>
          <Select
            labelId="diceRole-label"
            id="diceRole-select"
            value={formData?.roomDice || '1d4'}
            label={t('roomDice')}
            onChange={(event: SelectChangeEvent<string>) =>
              setFormData({
                ...formData,
                roomDice: event.target.value,
                roomUpdated: true,
              })
            }
          >
            <MenuItem value="1d4">1d4</MenuItem>
            <MenuItem value="1d6">1d6</MenuItem>
            <MenuItem value="2d4">2d4</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ m: 1 }} fullWidth>
          <InputLabel id="tile-count-label">
            <Trans i18nKey="roomTileCount" />
          </InputLabel>
          <Select
            labelId="tile-count-label"
            id="tile-count-select"
            value={formData?.roomTileCount || 40}
            label={t('roomTileCount')}
            onChange={(event: SelectChangeEvent) =>
              setFormData({
                ...formData,
                roomTileCount: Number(event.target.value),
                roomUpdated: true,
              })
            }
          >
            {tileMenuItem}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <Typography>
            <Trans i18nKey="averageRolls" />
            {rollAverage}
          </Typography>
        </FormControl>
      </Box>
    </>
  );
}
