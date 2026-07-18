import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';

import VoiceRows from '@/views/GameSettings/sections/VoiceRows';
import { analytics } from '@/services/analytics';
import {
  DEFAULT_HANDS_FREE_PRESET,
  HANDS_FREE_PRESETS,
  HandsFreePreset,
} from '@/helpers/handsFree';
import { useSettings } from '@/stores/settingsStore';
import { Settings } from '@/types/Settings';

interface HandsFreeDialogProps {
  open: boolean;
  onClose: () => void;
}

const formatRange = ({ min, max }: { min: number; max: number }): string => {
  const toLabel = (seconds: number): string =>
    seconds % 60 === 0 && seconds >= 60 ? `${seconds / 60}m` : `${seconds}s`;
  return `${toLabel(min)}–${toLabel(max)}`;
};

/**
 * Quick-config for Hands-Free play (see CONTEXT.md "Hands-Free"): a convenience
 * surface over the shared global settings (readRoll, voice, cadence) — not
 * separate state. Changes apply immediately.
 */
export default function HandsFreeDialog({ open, onClose }: HandsFreeDialogProps): JSX.Element {
  const { t } = useTranslation();
  const [settings, updateSettings] = useSettings();
  // VoiceRows needs a staged Settings object; voice changes flow to the store
  // through the onVoiceChange/onPitchChange callbacks.
  const [voiceForm, setVoiceForm] = useState<Settings>(settings as Settings);

  const enabled = Boolean(settings.handsFree);
  const preset = settings.handsFreePreset ?? DEFAULT_HANDS_FREE_PRESET;

  const handleToggle = (checked: boolean): void => {
    if (checked) {
      updateSettings({ handsFree: true, handsFreePreset: preset, readRoll: true });
    } else {
      updateSettings({ handsFree: false });
    }
    analytics.trackFeatureUsage({
      feature_name: 'hands_free',
      feature_category: 'settings',
      interaction_type: checked ? 'enable' : 'disable',
    });
  };

  const handlePreset = (_: unknown, value: HandsFreePreset | null): void => {
    if (!value) return;
    updateSettings({ handsFreePreset: value });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('handsFree', 'Hands-Free')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {t('handsFreeHint', 'The game rolls for you and reads each action aloud.')}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography>{t('handsFreeEnable', 'Enable Hands-Free')}</Typography>
          <Switch
            checked={enabled}
            onChange={(event) => handleToggle(event.target.checked)}
            slotProps={{ input: { 'aria-label': t('handsFreeEnable', 'Enable Hands-Free') } }}
          />
        </Box>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t('cadence', 'Roll cadence')}
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={preset}
          onChange={handlePreset}
          disabled={!enabled}
          aria-label={t('cadence', 'Roll cadence')}
          sx={{ mb: 2 }}
        >
          {(Object.keys(HANDS_FREE_PRESETS) as HandsFreePreset[]).map((key) => (
            <ToggleButton key={key} value={key} sx={{ flexDirection: 'column' }}>
              {t(`cadence_${key}`, key)}
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {formatRange(HANDS_FREE_PRESETS[key])}
              </Typography>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <VoiceRows
          formData={voiceForm}
          setFormData={setVoiceForm}
          onVoiceChange={(voiceName) => updateSettings({ voicePreference: voiceName })}
          onPitchChange={(pitch) => updateSettings({ voicePitch: pitch })}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('done', 'Done')}</Button>
      </DialogActions>
    </Dialog>
  );
}
