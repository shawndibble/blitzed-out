import { Divider, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import BackgroundSelect from '@/components/BackgroundSelect';
import VoiceSelect from '@/components/VoiceSelect';
import LanguageSelect from './LanguageSelect';
import AppBoolSwitch from './AppBoolSwitch';
import { useSettings } from '@/stores/settingsStore';
import { Settings } from '@/types/Settings';
import { isPublicRoom } from '@/helpers/strings';
import { ChangeEvent, useCallback, useRef } from 'react';

// Debounce utility
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
      // normally we wouldn't update settings as it can be very slow, but for switch toggles,
      // I want to ensure the local storage is updated immediately
      updateSettings({ [field]: event.target.checked });
    },
    [formData, setFormData, updateSettings]
  );

  const handleVoiceChange = useCallback(
    (voiceName: string): void => {
      // Update local storage immediately for voice changes
      updateSettings({ voicePreference: voiceName });
    },
    [updateSettings]
  );

  // Debounced version of pitch update to reduce write churn
  const debouncedPitchUpdate = useDebounce((pitch: number) => {
    updateSettings({ voicePitch: pitch });
  }, 300);

  const handlePitchChange = useCallback(
    (pitch: number): void => {
      // Clamp pitch to supported range (0.5-2.0)
      const clampedPitch = Math.max(0.5, Math.min(2.0, pitch));

      // Only update if the pitch actually changed to avoid unnecessary writes
      if (settings?.voicePitch !== clampedPitch) {
        debouncedPitchUpdate(clampedPitch);
      }
    },
    [settings?.voicePitch, debouncedPitchUpdate]
  );

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

      <Divider />

      <Typography variant="h5" sx={{ mt: 2, textTransform: 'capitalize' }}>
        <Trans i18nKey="misc" />
      </Typography>

      <AppBoolSwitch field="hideBoardActions" formData={formData} handleSwitch={handleSwitch} />
      <AppBoolSwitch field="advancedSettings" formData={formData} handleSwitch={handleSwitch} />

      <BackgroundSelect
        formData={formData}
        setFormData={setFormData}
        backgrounds={backgrounds}
        isPrivateRoom={isPrivateRoom}
      />
      <Divider />
    </>
  );
}
