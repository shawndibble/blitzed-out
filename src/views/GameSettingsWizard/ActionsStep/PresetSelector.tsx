import { Box, Card, CardContent, Chip, Grid, Typography } from '@mui/material';

import { PresetConfig } from '@/types/presets';
import { useTranslation } from 'react-i18next';

interface PresetSelectorProps {
  gameMode: string;
  onPresetSelect: (preset: PresetConfig) => void;
  selectedPreset?: string;
  actionsList: Record<string, any>;
  showTitle?: boolean;
}

export default function PresetSelector({
  gameMode,
  onPresetSelect,
  selectedPreset,
  actionsList,
  showTitle = true,
}: PresetSelectorProps) {
  const { t } = useTranslation();

  const PRESETS: Record<string, PresetConfig[]> = {
    solo: [
      {
        id: 'popperbating',
        name: t('presetPopperbating'),
        actions: ['bating'],
        consumptions: ['poppers'],
        intensities: {
          bating: 2,
          poppers: 1,
        },
      },
      {
        id: 'smoking-tits',
        name: t('presetSmokingTits'),
        actions: ['titTorture'],
        consumptions: ['vaping'],
        intensities: {
          titTorture: 2,
          vaping: 1,
        },
      },
      {
        id: 'exploration-solo',
        name: t('presetExplorationSolo'),
        actions: ['throatTraining', 'buttPlay', 'titTorture', 'ballBusting'],
        consumptions: [],
        intensities: {
          throatTraining: 1,
          buttPlay: 1,
          titTorture: 1,
          ballBusting: 1,
        },
      },
      {
        id: 'ball-busting',
        name: t('presetBallBusting'),
        actions: ['ballBusting', 'bating'],
        consumptions: ['poppers'],
        intensities: {
          ballBusting: 2,
          bating: 2,
        },
      },
    ],
    foreplay: [
      {
        id: 'romantic-start',
        name: t('presetRomanticStart'),
        actions: ['kissing', 'stripping', 'confessions'],
        consumptions: ['alcohol'],
        intensities: {
          kissing: 2,
          stripping: 1,
          confessions: 1,
          alcohol: 1,
        },
      },
      {
        id: 'degrading',
        name: t('presetDegrading'),
        actions: ['humiliation', 'footPlay', 'confessions'],
        consumptions: ['poppers'],
        intensities: {
          humiliation: 2,
          footPlay: 2,
          confessions: 3,
          poppers: 2,
        },
      },
      {
        id: 'body-worship',
        name: t('presetBodyWorship'),
        actions: ['bodyWorship', 'kissing', 'footPlay'],
        consumptions: [],
        intensities: {
          bodyWorship: 2,
          kissing: 1,
          footPlay: 2,
        },
      },
      {
        id: 'control-breath',
        name: t('presetControlBreath'),
        actions: ['breathPlay', 'bondage', 'humiliation'],
        consumptions: ['poppers'],
        intensities: {
          breathPlay: 2,
          bondage: 2,
          humiliation: 1,
          poppers: 1,
        },
      },
    ],
    sex: [
      {
        id: 'gentle-sex',
        name: t('presetGentleSex'),
        actions: ['throatTraining', 'bating', 'buttPlay'],
        consumptions: ['alcohol'],
        intensities: {
          throatTraining: 1,
          bating: 1,
          buttPlay: 1,
          alcohol: 1,
        },
      },
      {
        id: 'fisting',
        name: t('presetFisting'),
        actions: ['buttPlay'],
        consumptions: ['poppers'],
        intensities: {
          buttPlay: 4,
          poppers: 4,
        },
      },
      {
        id: 'bdsm',
        name: t('presetBdsm'),
        actions: ['pissPlay', 'throatTraining', 'spanking', 'titTorture'],
        consumptions: [],
        intensities: {
          pissPlay: 2,
          throatTraining: 2,
          spanking: 2,
          titTorture: 2,
        },
      },
      {
        id: 'breath-control',
        name: t('presetBreathControl'),
        actions: ['bating'],
        consumptions: ['gasMask'],
        intensities: {
          bating: 2,
          gasMask: 2,
        },
      },
    ],
  };

  const currentPresets = PRESETS[gameMode] || PRESETS.solo;

  const handlePresetClick = (preset: PresetConfig) => {
    onPresetSelect(preset);
  };

  return (
    <Box>
      {showTitle && (
        <Typography variant="h6" gutterBottom>
          {t('quickStart')}
        </Typography>
      )}

      <Grid container spacing={2}>
        {currentPresets.map((preset) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={preset.id}>
            <Card
              sx={{
                cursor: 'pointer',
                border: selectedPreset === preset.id ? 2 : 1,
                borderColor: selectedPreset === preset.id ? 'primary.main' : 'divider',
                backgroundColor: selectedPreset === preset.id ? 'primary.dark' : 'background.paper',
                transition: 'all 0.2s ease-in-out',
                height: '100%',
                boxShadow: 1,
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                  backgroundColor: selectedPreset === preset.id ? 'primary.dark' : 'action.hover',
                },
              }}
              onClick={() => handlePresetClick(preset)}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {preset.name}
                </Typography>

                <Box>
                  {preset.actions.map((action, index) => (
                    <Chip
                      key={`action-${index}`}
                      label={actionsList[action]?.label || action}
                      size="small"
                      variant="outlined"
                      sx={{
                        mr: 0.5,
                        mb: 0.5,
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&:hover': {
                          backgroundColor: 'primary.50',
                        },
                      }}
                    />
                  ))}
                  {preset.consumptions.map((consumption, index) => (
                    <Chip
                      key={`consumption-${index}`}
                      label={actionsList[consumption]?.label || consumption}
                      size="small"
                      color="secondary"
                      variant="outlined"
                      sx={{
                        mr: 0.5,
                        mb: 0.5,
                        borderColor: 'secondary.main',
                        color: 'secondary.main',
                        '&:hover': {
                          backgroundColor: 'secondary.50',
                        },
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
