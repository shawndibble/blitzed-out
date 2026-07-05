import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Slider,
  Typography,
} from '@mui/material';
import { ChangeEvent, JSX, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import AppBoolSwitch from '../AppSettings/AppBoolSwitch';
import VoiceSelect from '@/components/VoiceSelect';
import { AmbientSoundscape, Settings } from '@/types/Settings';
import { useSettings } from '@/stores/settingsStore';

function useDebounce<T extends any[]>(
  callback: (...args: T) => void,
  delay: number
): (...args: T) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  return useCallback(
    (...args: T) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  );
}

interface SoundSectionProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
}

/** Personal audio preferences: roll/chat sounds, TTS voice, haptics, ambient music. */
export default function SoundSection({ formData, setFormData }: SoundSectionProps): JSX.Element {
  const { t } = useTranslation();
  const [settings, updateSettings] = useSettings();

  const handleSwitch = useCallback(
    (event: ChangeEvent<HTMLInputElement>, field: string): void => {
      setFormData({ ...formData, [field]: event.target.checked });
      updateSettings({ [field]: event.target.checked });
    },
    [formData, setFormData, updateSettings]
  );

  const handleVoiceChange = useCallback(
    (voiceName: string): void => updateSettings({ voicePreference: voiceName }),
    [updateSettings]
  );

  const debouncedPitchUpdate = useDebounce((pitch: number) => {
    updateSettings({ voicePitch: pitch });
  }, 300);

  const handlePitchChange = useCallback(
    (pitch: number): void => {
      const clampedPitch = Math.max(0.5, Math.min(2.0, pitch));
      if (settings?.voicePitch !== clampedPitch) debouncedPitchUpdate(clampedPitch);
    },
    [settings?.voicePitch, debouncedPitchUpdate]
  );

  const handleAmbientSoundscapeChange = useCallback(
    (event: SelectChangeEvent): void => {
      const soundscape = event.target.value as AmbientSoundscape;
      setFormData({ ...formData, ambientSoundscape: soundscape });
      updateSettings({ ambientSoundscape: soundscape });
    },
    [formData, setFormData, updateSettings]
  );

  const debouncedAmbientVolumeUpdate = useDebounce((volume: number) => {
    updateSettings({ ambientVolume: volume });
  }, 300);

  const handleAmbientVolumeChange = useCallback(
    (_event: Event, newVolume: number | number[]): void => {
      const volume = Array.isArray(newVolume) ? newVolume[0] : newVolume;
      setFormData({ ...formData, ambientVolume: volume });
    },
    [formData, setFormData]
  );

  const handleAmbientVolumeCommit = useCallback(
    (_event: Event | React.SyntheticEvent, newVolume: number | number[]): void => {
      const volume = Array.isArray(newVolume) ? newVolume[0] : newVolume;
      const clampedVolume = Math.max(0, Math.min(1, volume));
      setFormData({ ...formData, ambientVolume: clampedVolume });
      debouncedAmbientVolumeUpdate(clampedVolume);
    },
    [formData, setFormData, debouncedAmbientVolumeUpdate]
  );

  const ambientVolume = formData.ambientVolume ?? 0.3;
  const ambientSoundscape = formData.ambientSoundscape ?? 'lounge';
  const withOthers = formData.gameMode === 'online';

  return (
    <Card variant="outlined">
      <CardContent>
        <AppBoolSwitch field="mySound" formData={formData} handleSwitch={handleSwitch} />
        {withOthers && (
          <AppBoolSwitch field="otherSound" formData={formData} handleSwitch={handleSwitch} />
        )}
        <AppBoolSwitch field="chatSound" formData={formData} handleSwitch={handleSwitch} />
        <AppBoolSwitch field="readRoll" formData={formData} handleSwitch={handleSwitch} />
        {formData.readRoll && (
          <VoiceSelect
            formData={formData}
            setFormData={setFormData}
            onVoiceChange={handleVoiceChange}
            onPitchChange={handlePitchChange}
          />
        )}
        <AppBoolSwitch field="hapticFeedback" formData={formData} handleSwitch={handleSwitch} />

        <AppBoolSwitch
          field="ambientMusicEnabled"
          formData={formData}
          handleSwitch={handleSwitch}
        />
        {formData.ambientMusicEnabled && (
          <Box sx={{ py: 1 }}>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel id="ambient-soundscape-label">{t('ambientSoundscape')}</InputLabel>
              <Select
                labelId="ambient-soundscape-label"
                value={ambientSoundscape}
                label={t('ambientSoundscape')}
                onChange={handleAmbientSoundscapeChange}
              >
                <MenuItem value="lounge">{t('soundscapeLounge')}</MenuItem>
                <MenuItem value="intimate">{t('soundscapeIntimate')}</MenuItem>
                <MenuItem value="party">{t('soundscapeParty')}</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ px: 2 }}>
              <Typography variant="body2" gutterBottom sx={{ color: 'text.secondary' }}>
                {t('ambientVolume')}
              </Typography>
              <Box sx={{ px: 1 }}>
                <Slider
                  value={ambientVolume}
                  onChange={handleAmbientVolumeChange}
                  onChangeCommitted={handleAmbientVolumeCommit}
                  min={0}
                  max={1}
                  step={0.05}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                  size="small"
                />
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
