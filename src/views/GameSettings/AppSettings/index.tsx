import { ChangeEvent, useCallback, useRef } from 'react';
import {
  Box,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Slider,
  Typography,
} from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';

import AppBoolSwitch from './AppBoolSwitch';
import BackgroundSelect from '@/components/BackgroundSelect';
import LanguageSelect from './LanguageSelect';
import { AmbientSoundscape, Settings } from '@/types/Settings';
import VoiceSelect from '@/components/VoiceSelect';
import { isPublicRoom } from '@/helpers/strings';
import { useSettings } from '@/stores/settingsStore';

function useDebounce<T extends any[]>(
  callback: (...args: T) => void,
  delay: number
): (...args: T) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  );
}

interface AppSettingsProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
  boardUpdated: () => void;
}

export default function AppSettings({
  formData,
  setFormData,
  boardUpdated,
}: AppSettingsProps): JSX.Element {
  const [settings, updateSettings] = useSettings();
  const isPrivateRoom = Boolean(formData.room && !isPublicRoom(formData.room));

  const { t } = useTranslation();
  const backgrounds: Record<string, string> = {
    useRoomBackground: t('useRoomBackground'),
    color: t('color'),
    gray: t('gray'),
    'metronome.gif': t('hypnoDick'),
    'pink-spiral.gif': t('pinkSpiral'),
    custom: t('customURL'),
  };

  const handleSwitch = useCallback(
    (event: ChangeEvent<HTMLInputElement>, field: string): void => {
      setFormData({ ...formData, [field]: event.target.checked });
      updateSettings({ [field]: event.target.checked });
    },
    [formData, setFormData, updateSettings]
  );

  const handleVoiceChange = useCallback(
    (voiceName: string): void => {
      updateSettings({ voicePreference: voiceName });
    },
    [updateSettings]
  );

  const debouncedPitchUpdate = useDebounce((pitch: number) => {
    updateSettings({ voicePitch: pitch });
  }, 300);

  const handlePitchChange = useCallback(
    (pitch: number): void => {
      const clampedPitch = Math.max(0.5, Math.min(2.0, pitch));

      if (settings?.voicePitch !== clampedPitch) {
        debouncedPitchUpdate(clampedPitch);
      }
    },
    [settings?.voicePitch, debouncedPitchUpdate]
  );

  const handleBackgroundChange = useCallback(
    (
      backgroundKey: string,
      backgroundValue: string,
      backgroundURLKey?: string,
      backgroundURLValue?: string
    ): void => {
      const updates: Partial<Settings> = { [backgroundKey]: backgroundValue };
      if (backgroundURLKey && backgroundURLValue !== undefined) {
        updates[backgroundURLKey] = backgroundURLValue;
      }
      updateSettings(updates);
    },
    [updateSettings]
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

  return (
    <>
      <LanguageSelect boardUpdated={boardUpdated} />

      <Typography variant="h5">
        <Trans i18nKey="dialog" />
      </Typography>

      <AppBoolSwitch field="playerDialog" formData={formData} handleSwitch={handleSwitch} />
      <AppBoolSwitch field="othersDialog" formData={formData} handleSwitch={handleSwitch} />

      <Divider />

      <Typography variant="h5" sx={{ mt: 2 }}>
        <Trans i18nKey="sounds" />
      </Typography>

      <AppBoolSwitch field="mySound" formData={formData} handleSwitch={handleSwitch} />
      <AppBoolSwitch field="otherSound" formData={formData} handleSwitch={handleSwitch} />
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

      <Divider />

      <Typography variant="h5" sx={{ mt: 2 }}>
        <Trans i18nKey="ambientMusic" />
      </Typography>

      <AppBoolSwitch field="ambientMusicEnabled" formData={formData} handleSwitch={handleSwitch} />

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
            <Typography variant="body2" color="text.secondary" gutterBottom>
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

      <Divider />

      <Typography variant="h5" sx={{ mt: 2, textTransform: 'capitalize' }}>
        <Trans i18nKey="misc" />
      </Typography>

      <AppBoolSwitch
        field="showDiceAnimation"
        formData={formData}
        handleSwitch={handleSwitch}
        defaultValue={true}
      />
      <AppBoolSwitch field="hideBoardActions" formData={formData} handleSwitch={handleSwitch} />
      <AppBoolSwitch
        field="wakeLockEnabled"
        formData={formData}
        handleSwitch={handleSwitch}
        defaultValue={true}
      />

      <BackgroundSelect
        formData={formData}
        setFormData={setFormData}
        backgrounds={backgrounds}
        isPrivateRoom={isPrivateRoom}
        onBackgroundChange={handleBackgroundChange}
      />
      <Divider />
    </>
  );
}
