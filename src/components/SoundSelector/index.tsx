import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Box,
  Tooltip,
  ListSubheader,
  SelectChangeEvent,
} from '@mui/material';
import { PlayArrow, VolumeOff } from '@mui/icons-material';
import { SOUND_CATEGORIES, playSound, getSoundById } from '@/utils/gameSounds';

interface SoundSelectorProps {
  selectedSoundId?: string;
  onSoundChange: (soundId: string) => void;
  label?: string;
}

export default function SoundSelector({
  selectedSoundId,
  onSoundChange,
  label = 'Turn Sound',
}: SoundSelectorProps): JSX.Element {
  const handlePlaySample = async () => {
    if (!selectedSoundId) return;

    const sound = getSoundById(selectedSoundId);
    if (sound) {
      try {
        const success = await playSound(sound);
        if (!success) {
          console.error('Failed to play sound');
        }
      } catch (error) {
        console.error('Failed to play sound:', error);
      }
    }
  };

  const handleSelectChange = (event: SelectChangeEvent) => {
    onSoundChange(event.target.value as string);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="sound-select-label">{label}</InputLabel>
        <Select
          labelId="sound-select-label"
          value={selectedSoundId || ''}
          label={label}
          onChange={handleSelectChange}
        >
          <MenuItem value="">
            <Box display="flex" alignItems="center" gap={1}>
              <VolumeOff fontSize="small" />
              No sound
            </Box>
          </MenuItem>

          {SOUND_CATEGORIES.map((category) => [
            <ListSubheader key={`header-${category.id}`} sx={{ fontWeight: 'bold' }}>
              {category.name}
            </ListSubheader>,
            ...category.sounds.map((sound) => (
              <MenuItem key={sound.id} value={sound.id} sx={{ pl: 3 }}>
                {sound.name}
              </MenuItem>
            )),
          ])}
        </Select>
      </FormControl>

      <Tooltip title="Play sample">
        <IconButton
          onClick={handlePlaySample}
          color="primary"
          disabled={!selectedSoundId}
          size="small"
        >
          <PlayArrow />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
