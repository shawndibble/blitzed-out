import { MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingGroup, SettingRow } from '../components/SettingRow';
import { DEFAULT_TILE_COUNT } from '@/constants/boardConstants';
import { Settings } from '@/types/Settings';

const MIN_TILES = 20;
const MAX_TILES = 80;
const TILE_STEP = 5;

const TILE_OPTIONS = Array.from(
  { length: (MAX_TILES - MIN_TILES) / TILE_STEP + 1 },
  (_, index) => MIN_TILES + index * TILE_STEP
);

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
 * Board size and dice, one group of rows. Board-generation settings, not
 * room settings — they work in public rooms too.
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
    <SettingGroup>
      <SettingRow
        label={t('roomTileCount')}
        description={t('rollsPerGame', { count: rollEstimate, dice })}
      >
        <Select
          size="small"
          value={String(TILE_OPTIONS.includes(tileCount) ? tileCount : DEFAULT_TILE_COUNT)}
          onChange={(event: SelectChangeEvent<string>) =>
            setFormData({
              ...formData,
              roomTileCount: Number(event.target.value),
              roomUpdated: true,
              boardUpdated: true,
            })
          }
          aria-label={t('roomTileCount')}
        >
          {TILE_OPTIONS.map((count) => (
            <MenuItem key={count} value={String(count)}>
              {t('tilesCount', { count })}
            </MenuItem>
          ))}
        </Select>
      </SettingRow>
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
  );
}
