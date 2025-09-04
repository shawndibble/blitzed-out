import { useState, useEffect, useCallback } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Box,
  Typography,
  Tooltip,
  Slider,
} from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { SelectChangeEvent } from '@mui/material/Select';
import { VoiceOption, tts } from '@/services/tts';
import { useTTS } from '@/hooks/useTTS';
import { Settings } from '@/types/Settings';

interface VoiceSelectProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
  onVoiceChange?: (voiceName: string) => void;
  onPitchChange?: (pitch: number) => void;
}

export default function VoiceSelect({
  formData,
  setFormData,
  onVoiceChange,
  onPitchChange,
}: VoiceSelectProps): JSX.Element {
  const { t } = useTranslation();
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { speak } = useTTS();

  const selectedVoice = formData.voicePreference || '';
  const selectedPitch = formData.voicePitch ?? 1.0;

  const handleVoiceChange = useCallback(
    (voiceName: string) => {
      const updatedFormData = { ...formData, voicePreference: voiceName };
      setFormData(updatedFormData);
      onVoiceChange?.(voiceName);
    },
    [formData, setFormData, onVoiceChange]
  );

  const handlePitchChange = useCallback(
    (_event: Event, newPitch: number | number[]) => {
      const pitch = Array.isArray(newPitch) ? newPitch[0] : newPitch;

      // Only update UI state for smooth slider interaction - don't save to app yet
      setFormData((prevData) => ({ ...prevData, voicePitch: pitch }));
    },
    [setFormData]
  );

  const handlePitchCommit = useCallback(
    (_event: Event | React.SyntheticEvent, newPitch: number | number[]) => {
      const pitch = Array.isArray(newPitch) ? newPitch[0] : newPitch;
      const clampedPitch = Math.max(0.5, Math.min(2.0, pitch));

      // Save the final clamped value to app state
      setFormData((prevData) => ({ ...prevData, voicePitch: clampedPitch }));
      onPitchChange?.(clampedPitch);
    },
    [setFormData, onPitchChange]
  );

  useEffect(() => {
    let mounted = true;

    const loadVoices = async () => {
      try {
        if (mounted) {
          setIsLoading(true);
          const availableVoices = await tts.getAvailableVoicesAsync();

          if (mounted) {
            // Filter to only show voices with "Google" in the name, but fall back to all voices if no Google voices
            const googleVoices = availableVoices.filter(
              (voice) => voice.displayName.includes('Google') || voice.name.includes('Google')
            );
            const voicesToUse = googleVoices.length > 0 ? googleVoices : availableVoices;
            setVoices(voicesToUse);

            // Validate selectedVoice against filtered voicesToUse and reset if not present
            if (selectedVoice && !voicesToUse.some((voice) => voice.name === selectedVoice)) {
              if (mounted) {
                const preferredVoice = await tts.getPreferredVoiceAsync();
                if (preferredVoice && voicesToUse.some((voice) => voice.name === preferredVoice)) {
                  handleVoiceChange(preferredVoice);
                } else if (voicesToUse.length > 0) {
                  handleVoiceChange(voicesToUse[0].name);
                }
              }
            }

            // Set default voice if none selected
            if (!selectedVoice && voicesToUse.length > 0) {
              const preferredVoice = await tts.getPreferredVoiceAsync();
              // Use the preferred voice if it's available, otherwise use the first available voice
              if (
                preferredVoice &&
                voicesToUse.some((voice) => voice.name === preferredVoice) &&
                mounted
              ) {
                handleVoiceChange(preferredVoice);
              } else if (mounted) {
                handleVoiceChange(voicesToUse[0].name);
              }
            }

            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Failed to load voices:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadVoices();

    return () => {
      mounted = false;
    };
  }, [selectedVoice, handleVoiceChange]);

  const handleSelectChange = (event: SelectChangeEvent) => {
    handleVoiceChange(event.target.value);
  };

  const handlePlaySample = async () => {
    const voiceToPlay = selectedVoice || (voices.length > 0 ? voices[0].name : '');
    if (!voiceToPlay) return;

    const sampleText = t('tts.sampleText', 'Take a drink and enjoy the game.');

    try {
      await speak(sampleText, {
        voice: voiceToPlay,
        pitch: selectedPitch,
      });
    } catch (error) {
      console.error('Failed to play sample:', error);
    }
  };

  const getVoiceLabel = (voice: VoiceOption): string => {
    // Remove "Google " from the beginning of the display name since all voices are Google
    return voice.displayName.replace(/^Google\s+/i, '');
  };

  if (isLoading) {
    return (
      <Box sx={{ py: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {t('loadingVoices', 'Loading voices...')}
        </Typography>
      </Box>
    );
  }

  if (voices.length === 0) {
    return (
      <Box sx={{ py: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {t('noVoicesAvailable', 'No voices available for this language')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="voice-select-label">{t('voiceSelection', 'Voice')}</InputLabel>
          <Select
            labelId="voice-select-label"
            value={selectedVoice}
            label={t('voiceSelection', 'Voice')}
            onChange={handleSelectChange}
          >
            {voices.map((voice) => (
              <MenuItem key={voice.name} value={voice.name}>
                {getVoiceLabel(voice)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Tooltip title={t('playSample', 'Play sample')}>
          <IconButton
            onClick={handlePlaySample}
            color="primary"
            disabled={!selectedVoice}
            size="small"
          >
            <PlayArrow />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ px: 2, pb: 1 }}>
        <Box sx={{ px: 1 }}>
          <Slider
            value={selectedPitch}
            onChange={handlePitchChange}
            onChangeCommitted={handlePitchCommit}
            min={0.5}
            max={2.0}
            step={0.1}
            marks={[
              { value: 0.5, label: t('low', 'Low') },
              { value: 1.0, label: t('normal', 'Normal') },
              { value: 2.0, label: t('high', 'High') },
            ]}
            valueLabelDisplay="auto"
            size="small"
          />
        </Box>
      </Box>
    </Box>
  );
}
