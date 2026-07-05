import { Box, Card, MenuItem, Select, SelectChangeEvent, Slider, Typography } from '@mui/material';
import { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingGroup, SettingRow } from '../components/SettingRow';
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Card variant="outlined" sx={{ px: 2, py: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {t('roomTileCount')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mt: 0.5 }}>
          <Slider
            value={tileCount}
            min={MIN_TILES}
            max={MAX_TILES}
            step={1}
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
            sx={{ flex: 1 }}
          />
          <Typography
            variant="body2"
            sx={{
              color: 'primary.main',
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              minWidth: 64,
              textAlign: 'right',
            }}
          >
            {t('tilesCount', { count: tileCount })}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            color: 'text.secondary',
            fontSize: '0.7rem',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span>{MIN_TILES}</span>
          <span>{t('rollsPerGame', { count: rollEstimate, dice })}</span>
          <span>{MAX_TILES}</span>
        </Box>
      </Card>

      <SettingGroup>
        <SettingRow label={t('roomDice')} description={t('roomDiceCaption')}>
          <Select
            size="small"
            value={dice}
            onChange={(event: SelectChangeEvent<string>) =>
              setFormData({
                ...formData,
                roomDice: event.target.value,
                roomUpdated: true,
              })
            }
            aria-label={t('roomDice')}
          >
            <MenuItem value="1d4">1d4</MenuItem>
            <MenuItem value="1d6">1d6</MenuItem>
            <MenuItem value="2d4">2d4</MenuItem>
          </Select>
        </SettingRow>
      </SettingGroup>
    </Box>
  );
}
