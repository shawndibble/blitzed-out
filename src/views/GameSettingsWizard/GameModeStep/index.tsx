import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Collapse,
  Card,
  CardContent,
  Grid,
  Stack,
  Chip,
} from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import ButtonRow from '@/components/ButtonRow';
import { isOnlineMode } from '@/helpers/strings';
import { FormData } from '@/types';
import { PlayerRole, Settings } from '@/types/Settings';

interface GameModeStepProps {
  formData: FormData & Partial<Settings>;
  setFormData: React.Dispatch<React.SetStateAction<FormData & Partial<Settings>>>;
  nextStep: () => void;
  prevStep: () => void;
}

export default function GameModeStep({
  formData,
  setFormData,
  nextStep,
  prevStep,
}: GameModeStepProps): JSX.Element {
  const [visible, setVisible] = useState(!isOnlineMode(formData?.gameMode));
  const { t } = useTranslation();

  // Update visibility when game mode changes
  useEffect(() => {
    setVisible(!isOnlineMode(formData?.gameMode));
  }, [formData?.gameMode]);

  const interactionModes = [
    {
      id: 'local',
      title: 'yesInteracting',
      description: t('physicalInteractionDesc'),
      isSelected: !isOnlineMode(formData?.gameMode),
    },
    {
      id: 'online',
      title: 'noInteracting',
      description: t('soloOnlinePlayDesc'),
      isSelected: isOnlineMode(formData?.gameMode),
    },
  ];

  const roleOptions = [
    { value: 'dom', label: 'Dominant', description: t('dominantRoleDesc') },
    { value: 'vers', label: 'Switch', description: t('switchRoleDesc') },
    { value: 'sub', label: 'Submissive', description: t('submissiveRoleDesc') },
  ];

  const intensityModes = [
    {
      id: 'clothed',
      title: 'noNaked',
      description: t('foreplayClothedDesc'),
      isSelected: !formData.isNaked,
    },
    {
      id: 'naked',
      title: 'yesNaked',
      description: t('intimateNudityDesc'),
      isSelected: formData.isNaked,
    },
  ];

  return (
    <Box sx={{ minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        <Trans i18nKey="playingWithPeople" />
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {interactionModes.map((mode) => (
          <Grid size={{ xs: 12, sm: 6 }} key={mode.id}>
            <Card
              sx={{
                cursor: 'pointer',
                border: mode.isSelected ? '3px solid' : '1px solid',
                borderColor: mode.isSelected ? 'primary.main' : 'divider',
                backgroundColor: mode.isSelected ? 'primary.50' : 'background.paper',
                transition: 'all 0.2s ease-in-out',
                height: '100%',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'translateY(-2px)',
                  boxShadow: 2,
                },
              }}
              onClick={() =>
                setFormData({
                  ...formData,
                  gameMode: mode.id === 'local' ? 'local' : 'online',
                  roomRealtime: mode.id !== 'local',
                })
              }
            >
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={1} alignItems="center" textAlign="center">
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t(mode.title)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {mode.description}
                  </Typography>
                  {mode.isSelected && (
                    <Chip label={t('selected')} color="primary" size="small" sx={{ mt: 1 }} />
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Collapse in={visible} timeout={500}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            <Trans i18nKey="yourRole" />
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {roleOptions.map((role) => (
              <Grid size={{ xs: 12, sm: 4 }} key={role.value}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: formData.role === role.value ? '2px solid' : '1px solid',
                    borderColor: formData.role === role.value ? 'primary.main' : 'divider',
                    backgroundColor:
                      formData.role === role.value ? 'primary.50' : 'background.paper',
                    transition: 'all 0.2s ease-in-out',
                    height: '100%',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                    },
                  }}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      role: role.value as PlayerRole,
                    })
                  }
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack spacing={1} alignItems="center" textAlign="center">
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {t(role.value)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {role.description}
                      </Typography>
                      {formData.role === role.value && (
                        <Chip label={t('selected')} color="primary" size="small" sx={{ mt: 1 }} />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            <Trans i18nKey="areYouNaked" />
          </Typography>

          <Grid container spacing={2}>
            {intensityModes.map((mode) => (
              <Grid size={{ xs: 12, sm: 6 }} key={mode.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: mode.isSelected ? '2px solid' : '1px solid',
                    borderColor: mode.isSelected ? 'primary.main' : 'divider',
                    backgroundColor: mode.isSelected ? 'primary.50' : 'background.paper',
                    transition: 'all 0.2s ease-in-out',
                    height: '100%',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                    },
                  }}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      isNaked: mode.id === 'naked',
                    })
                  }
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={1} alignItems="center" textAlign="center">
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {t(mode.title)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {mode.description}
                      </Typography>
                      {mode.isSelected && (
                        <Chip label={t('selected')} color="primary" size="small" sx={{ mt: 1 }} />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Collapse>

      <Box sx={{ flexGrow: 1 }} />
      <ButtonRow>
        <Button onClick={prevStep}>
          <Trans i18nKey="previous" />
        </Button>
        <Button variant="contained" onClick={nextStep}>
          <Trans i18nKey="next" />
        </Button>
      </ButtonRow>
    </Box>
  );
}
