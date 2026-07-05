import {
  Box,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Slider,
  Typography,
} from '@mui/material';
import { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_TILE_COUNT } from '@/constants/boardConstants';
import { Settings } from '@/types/Settings';

const MIN_TILES = 20;
const MAX_TILES = 80;

const DICE_ROLL_AVERAGE: Record<string, number> = {
  '1d4': 2.5,
  '1d6': 3.5,
  '2d4': 5,
};

interface SizePaceSectionProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
}

/**
 * Board size and dice. Board-generation settings, not room settings — they
 * work in public rooms too. Advanced surface, so tile count is granular
 * (step 1), unlike the wizard's coarse steps.
 */
export default function SizePaceSection({
  formData,
  setFormData,
}: SizePaceSectionProps): JSX.Element {
  const { t } = useTranslation();

  const tileCount = formData.roomTileCount || DEFAULT_TILE_COUNT;
  const dice = formData.roomDice || '1d6';
  const rollEstimate = Math.floor(tileCount / (DICE_ROLL_AVERAGE[dice] ?? 3.5));

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ px: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            {t('roomTileCount')}
          </Typography>
          <Slider
            value={tileCount}
            min={MIN_TILES}
            max={MAX_TILES}
            step={1}
            marks={[
              { value: MIN_TILES, label: String(MIN_TILES) },
              { value: DEFAULT_TILE_COUNT, label: String(DEFAULT_TILE_COUNT) },
              { value: MAX_TILES, label: String(MAX_TILES) },
            ]}
            valueLabelDisplay="auto"
            onChange={(_, value) =>
              setFormData({
                ...formData,
                roomTileCount: Array.isArray(value) ? value[0] : value,
                roomUpdated: true,
                boardUpdated: true,
              })
            }
            aria-label={t('roomTileCount')}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mt: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="dice-select-label">{t('roomDice')}</InputLabel>
            <Select
              labelId="dice-select-label"
              value={dice}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('averageRolls')}
            </Typography>
            <Chip
              label={rollEstimate}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
