import { Box, MenuItem, Select, SelectChangeEvent, Slider, Switch } from '@mui/material';
import { ChangeEvent, JSX, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingGroup, SettingRow } from '../components/SettingRow';
import VoiceRows from './VoiceRows';
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
  const withOthers = formData.gameMode === 'online';

  const boolSwitch = (field: string, defaultValue = false): JSX.Element => (
    <Switch
      checked={(formData[field] as boolean | undefined) ?? defaultValue}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [field]: event.target.checked });
        updateSettings({ [field]: event.target.checked });
      }}
      slotProps={{ input: { 'aria-label': t(field) } }}
    />
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
      if (settings?.voicePitch !== pitch) debouncedPitchUpdate(pitch);
    },
    [settings?.voicePitch, debouncedPitchUpdate]
  );

  const debouncedAmbientVolumeUpdate = useDebounce((volume: number) => {
    updateSettings({ ambientVolume: volume });
  }, 300);

  const ambientVolume = formData.ambientVolume ?? 0.3;
  const ambientSoundscape = formData.ambientSoundscape ?? 'lounge';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <SettingGroup>
        <SettingRow label={t('mySound')}>{boolSwitch('mySound')}</SettingRow>
        {withOthers && <SettingRow label={t('otherSound')}>{boolSwitch('otherSound')}</SettingRow>}
        <SettingRow label={t('chatSound')}>{boolSwitch('chatSound')}</SettingRow>
        <SettingRow label={t('hapticFeedback')}>{boolSwitch('hapticFeedback')}</SettingRow>
      </SettingGroup>

      <SettingGroup>
        <SettingRow label={t('readRoll')} description={t('readRollCaption')}>
          {boolSwitch('readRoll')}
        </SettingRow>
        {formData.readRoll && (
          <VoiceRows
            formData={formData}
            setFormData={setFormData}
            onVoiceChange={handleVoiceChange}
            onPitchChange={handlePitchChange}
          />
        )}
      </SettingGroup>

      <SettingGroup>
        <SettingRow label={t('ambientMusicEnabled')}>
          {formData.ambientMusicEnabled && (
            <Select
              size="small"
              value={ambientSoundscape}
              onChange={(event: SelectChangeEvent) => {
                const soundscape = event.target.value as AmbientSoundscape;
                setFormData({ ...formData, ambientSoundscape: soundscape });
                updateSettings({ ambientSoundscape: soundscape });
              }}
              aria-label={t('ambientSoundscape')}
            >
              <MenuItem value="lounge">{t('soundscapeLounge')}</MenuItem>
              <MenuItem value="intimate">{t('soundscapeIntimate')}</MenuItem>
              <MenuItem value="party">{t('soundscapeParty')}</MenuItem>
            </Select>
          )}
          {boolSwitch('ambientMusicEnabled')}
        </SettingRow>
        {formData.ambientMusicEnabled && (
          <SettingRow label={t('ambientVolume')}>
            <Slider
              value={ambientVolume}
              onChange={(_, newVolume) => {
                const volume = Array.isArray(newVolume) ? newVolume[0] : newVolume;
                setFormData({ ...formData, ambientVolume: volume });
              }}
              onChangeCommitted={(_, newVolume) => {
                const volume = Array.isArray(newVolume) ? newVolume[0] : newVolume;
                const clampedVolume = Math.max(0, Math.min(1, volume));
                setFormData({ ...formData, ambientVolume: clampedVolume });
                debouncedAmbientVolumeUpdate(clampedVolume);
              }}
              min={0}
              max={1}
              step={0.05}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
              size="small"
              aria-label={t('ambientVolume')}
              sx={{ width: 160 }}
            />
          </SettingRow>
        )}
      </SettingGroup>
    </Box>
  );
}
