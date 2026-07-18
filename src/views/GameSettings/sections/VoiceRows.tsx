import {
  Button,
  MenuItem,
  Select,
  SelectChangeEvent,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { Dispatch, JSX, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingRow } from '../components/SettingRow';
import { VoiceOption, tts } from '@/services/tts';
import { useTTS } from '@/hooks/useTTS';
import { Settings } from '@/types/Settings';

const PITCH_PRESETS: Record<string, number> = { low: 0.75, normal: 1.0, high: 1.5 };

const nearestPitchPreset = (pitch: number): string =>
  Object.entries(PITCH_PRESETS).reduce(
    (best, [key, value]) =>
      Math.abs(value - pitch) < Math.abs(PITCH_PRESETS[best] - pitch) ? key : best,
    'normal'
  );

interface VoiceRowsProps {
  formData: Settings;
  setFormData: Dispatch<SetStateAction<Settings>>;
  onVoiceChange: (voiceName: string) => void;
  onPitchChange: (pitch: number) => void;
}

/** Voice + Pitch rows for text-to-speech, shown when "read my roll" is on. */
export default function VoiceRows({
  formData,
  setFormData,
  onVoiceChange,
  onPitchChange,
}: VoiceRowsProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const { speak } = useTTS();
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const selectedVoice = formData.voicePreference || '';
  const selectedPitch = formData.voicePitch ?? 1.0;

  // Tracks whether the current voice was auto-picked (so it can keep following
  // locale changes) or manually chosen (so it never gets silently overridden).
  const manuallySelectedRef = useRef<boolean>(Boolean(formData.voicePreference));
  const lastAutoLocaleRef = useRef<string | undefined>(undefined);

  // Functional update keeps this callback stable (no formData dependency) so
  // the voice-loading effect below only re-runs when the selected voice
  // actually changes — not on every unrelated GameSettings edit.
  const handleVoiceChange = useCallback(
    (voiceName: string, isManual: boolean = true): void => {
      manuallySelectedRef.current = isManual;
      setFormData((prev) => ({ ...prev, voicePreference: voiceName }));
      onVoiceChange(voiceName);
    },
    [setFormData, onVoiceChange]
  );

  useEffect(() => {
    let mounted = true;
    const localeHint = i18n.language?.split('-')[0];

    const loadVoices = async (): Promise<void> => {
      try {
        const availableVoices = await tts.getAvailableVoicesAsync();
        if (!mounted) return;

        // Google voices sound best; fall back to everything if none exist.
        const googleVoices = availableVoices.filter(
          (voice) => voice.displayName.includes('Google') || voice.name.includes('Google')
        );
        const voicesToUse = googleVoices.length > 0 ? googleVoices : availableVoices;
        setVoices(voicesToUse);

        // Re-run auto-selection when there's no valid voice yet, or when the
        // locale changed since the last auto-pick — but never override a
        // voice the user picked manually.
        const needsAutoSelect =
          !selectedVoice || !voicesToUse.some((voice) => voice.name === selectedVoice);
        const shouldFollowLocale =
          !manuallySelectedRef.current && lastAutoLocaleRef.current !== localeHint;

        if (voicesToUse.length > 0 && (needsAutoSelect || shouldFollowLocale)) {
          const preferredVoice = await tts.getPreferredVoiceAsync(localeHint);
          if (!mounted) return;
          const fallback = voicesToUse.some((voice) => voice.name === preferredVoice)
            ? (preferredVoice as string)
            : voicesToUse[0].name;
          lastAutoLocaleRef.current = localeHint;
          handleVoiceChange(fallback, false);
        }
      } catch {
        // Voice list unavailable; the rows below render an explanatory message.
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadVoices();
    return () => {
      mounted = false;
    };
  }, [selectedVoice, handleVoiceChange, i18n.language]);

  const playSample = async (): Promise<void> => {
    const voiceToPlay = selectedVoice || voices[0]?.name;
    if (!voiceToPlay) return;
    try {
      await speak(t('tts.sampleText', 'Take a drink and enjoy the game.'), {
        voice: voiceToPlay,
        pitch: selectedPitch,
      });
    } catch {
      // Sample playback is best-effort; TTS may be blocked until user interaction.
    }
  };

  const handlePitchPreset = (_: unknown, preset: string | null): void => {
    if (!preset) return;
    const pitch = PITCH_PRESETS[preset];
    setFormData((prev) => ({ ...prev, voicePitch: pitch }));
    onPitchChange(pitch);
  };

  if (isLoading) {
    return (
      <SettingRow label={t('voiceSelection')}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('loadingVoices', 'Loading voices...')}
        </Typography>
      </SettingRow>
    );
  }

  if (voices.length === 0) {
    return (
      <SettingRow label={t('voiceSelection')}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('noVoicesAvailable', 'No voices available')}
        </Typography>
      </SettingRow>
    );
  }

  return (
    <>
      <SettingRow label={t('voiceSelection')}>
        <Select
          size="small"
          value={voices.some((voice) => voice.name === selectedVoice) ? selectedVoice : ''}
          onChange={(event: SelectChangeEvent<string>) => handleVoiceChange(event.target.value)}
          aria-label={t('voiceSelection')}
          sx={{ maxWidth: 240 }}
        >
          {voices.map((voice) => (
            <MenuItem key={voice.name} value={voice.name}>
              {voice.displayName.replace(/^Google\s+/i, '')}
            </MenuItem>
          ))}
        </Select>
        <Button size="small" variant="outlined" onClick={playSample}>
          {t('playSample', 'Sample')}
        </Button>
      </SettingRow>
      <SettingRow label={t('pitch')}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={nearestPitchPreset(selectedPitch)}
          onChange={handlePitchPreset}
          aria-label={t('pitch')}
        >
          <ToggleButton value="low">{t('low')}</ToggleButton>
          <ToggleButton value="normal">{t('normal')}</ToggleButton>
          <ToggleButton value="high">{t('high')}</ToggleButton>
        </ToggleButtonGroup>
      </SettingRow>
    </>
  );
}
