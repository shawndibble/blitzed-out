import { Box, Card, CardContent, Typography, Grid, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PresetConfig } from '@/types/presets';

interface PresetSelectorProps {
  gameMode: string;
  onPresetSelect: (preset: PresetConfig) => void;
  selectedPreset?: string;
  actionsList: Record<string, any>;
}

export default function PresetSelector({
  gameMode,
  onPresetSelect,
  selectedPreset,
  actionsList,
}: PresetSelectorProps) {
  const { t } = useTranslation();

  const PRESETS: Record<string, PresetConfig[]> = {
    solo: [
      {
        id: 'popperbating',
        name: t('presetPopperbating'),
        description: 'Intense enhancement session',
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
        description: 'Enhanced sensation focus',
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
        description: 'Discover new sensations',
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
        description: 'Intense impact play',
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
        description: 'Gentle romantic beginning',
        actions: ['kissing', 'stripping'],
        consumptions: ['alcohol'],
        intensities: {
          kissing: 2,
          stripping: 1,
          alcohol: 1,
        },
      },
      {
        id: 'degrading',
        name: t('presetDegrading'),
        description: 'Humiliation and degradation play',
        actions: ['humiliation', 'footPlay', 'breathPlay'],
        consumptions: ['poppers'],
        intensities: {
          humiliation: 2,
          footPlay: 2,
          breathPlay: 2,
          poppers: 2,
        },
      },
      {
        id: 'sensual-touch',
        name: t('presetSensualTouch'),
        description: 'Focus on touch and sensation',
        actions: ['kissing', 'footPlay', 'tickling'],
        consumptions: [],
        intensities: {
          kissing: 2,
          footPlay: 1,
          tickling: 1,
        },
      },
      {
        id: 'electric-play',
        name: t('presetElectricPlay'),
        description: 'Sensation play with intensity',
        actions: ['electric', 'bondage'],
        consumptions: ['vaping'],
        intensities: {
          electric: 1,
          bondage: 2,
          vaping: 1,
        },
      },
    ],
    sex: [
      {
        id: 'gentle-sex',
        name: t('presetGentleSex'),
        description: 'Gentle intimate pleasure',
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
        description: 'Extreme penetration play',
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
        description: 'Bondage and discipline play',
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
        description: 'Breath play and sensation',
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
      <Typography variant="h6" gutterBottom>
        {t('quickStart')}
      </Typography>

      <Grid container spacing={2}>
        {currentPresets.map((preset) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={preset.id}>
            <Card
              sx={{
                cursor: 'pointer',
                border: selectedPreset === preset.id ? 2 : 1,
                borderColor: selectedPreset === preset.id ? 'primary.main' : 'divider',
                backgroundColor: selectedPreset === preset.id ? 'primary.50' : 'background.paper',
                transition: 'all 0.2s ease-in-out',
                height: '100%',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'translateY(-2px)',
                  boxShadow: 2,
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
