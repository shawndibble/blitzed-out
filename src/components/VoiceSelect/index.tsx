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
}

export default function VoiceSelect({
  formData,
  setFormData,
  onVoiceChange,
}: VoiceSelectProps): JSX.Element {
  const { t } = useTranslation();
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { speak } = useTTS();

  const selectedVoice = formData.voicePreference || '';

  const handleVoiceChange = useCallback(
    (voiceName: string) => {
      const updatedFormData = { ...formData, voicePreference: voiceName };
      setFormData(updatedFormData);
      onVoiceChange?.(voiceName);
    },
    [formData, setFormData, onVoiceChange]
  );

  // Load available voices
  useEffect(() => {
    let mounted = true;

    const loadVoices = async () => {
      try {
        if (mounted) {
          setIsLoading(true);
          const availableVoices = await tts.getAvailableVoicesAsync();

          if (mounted) {
            setVoices(availableVoices);

            // Set default voice if none selected
            if (!selectedVoice && availableVoices.length > 0) {
              const preferredVoice = await tts.getPreferredVoiceAsync();
              if (preferredVoice && mounted) {
                handleVoiceChange(preferredVoice);
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

    // Get sample text from i18next translations
    const sampleText = t('tts.sampleText', 'Take a drink and enjoy the game.');

    try {
      await speak(sampleText, {
        voice: voiceToPlay,
        pitch: -2.0, // Match the pitch from the main TTS
      });
    } catch (error) {
      console.error('Failed to play sample:', error);
    }
  };

  // Get voice label
  const getVoiceLabel = (voice: VoiceOption): string => {
    return voice.displayName;
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
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
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
  );
}
