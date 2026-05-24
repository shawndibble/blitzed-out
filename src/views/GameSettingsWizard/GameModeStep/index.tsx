import { Box, Button, Typography, Card, CardContent, Grid, Stack, Chip } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import ButtonRow from '@/components/ButtonRow';
import { FormData } from '@/types';
import { PlayerRole, Settings } from '@/types/Settings';
import type { PlayerGender } from '@/types/localPlayers';

interface GameModeStepProps {
  formData: FormData & Partial<Settings>;
  setFormData: React.Dispatch<React.SetStateAction<FormData & Partial<Settings>>>;
  nextStep: () => void;
  prevStep: () => void;
}

const genderOptions = [
  { value: 'male', labelKey: 'localPlayers.gender.male' },
  { value: 'female', labelKey: 'localPlayers.gender.female' },
  { value: 'non-binary', labelKey: 'localPlayers.gender.nonBinary' },
] as const;

const cardSx = (selected: boolean) => ({
  cursor: 'pointer',
  border: selected ? '2px solid' : '1px solid',
  borderColor: selected ? 'primary.main' : 'divider',
  backgroundColor: selected ? 'primary.50' : 'background.paper',
  transition: 'all 0.2s ease-in-out',
  height: '100%',
  '&:hover': {
    borderColor: 'primary.main',
    transform: 'translateY(-2px)',
    boxShadow: 2,
  },
});

export default function GameModeStep({
  formData,
  setFormData,
  nextStep,
  prevStep,
}: GameModeStepProps): JSX.Element {
  const { t } = useTranslation();

  const isOnline = formData.gameMode === 'online';
  const isLocal = formData.gameMode === 'local';
  const soloPlay = formData.soloPlay !== false;

  const showParticipationStyle = isOnline;
  const showGender = formData.gameMode === 'solo' || isOnline;
  const showRole = isOnline && !soloPlay;
  const showNaked = isLocal || (isOnline && !soloPlay);

  const roleOptions = [
    { value: 'dom', description: t('dominantRoleDesc') },
    { value: 'vers', description: t('switchRoleDesc') },
    { value: 'sub', description: t('submissiveRoleDesc') },
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
      isSelected: !!formData.isNaked,
    },
  ];

  const participationOptions = [
    {
      id: 'solo',
      titleKey: 'participationStyle.solo.title',
      descKey: 'participationStyle.solo.description',
      selected: soloPlay,
      onClick: () => setFormData({ ...formData, soloPlay: true }),
    },
    {
      id: 'group',
      titleKey: 'participationStyle.group.title',
      descKey: 'participationStyle.group.description',
      selected: !soloPlay,
      onClick: () => setFormData({ ...formData, soloPlay: false }),
    },
  ];

  return (
    <Box sx={{ minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        <Trans i18nKey="gameModeSelection" />
      </Typography>

      {showParticipationStyle && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
            <Trans i18nKey="participationStyle.title" />
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <Trans i18nKey="participationStyle.subtitle" />
          </Typography>
          <Grid container spacing={2}>
            {participationOptions.map((opt) => (
              <Grid size={{ xs: 12, sm: 6 }} key={opt.id}>
                <Card
                  role="button"
                  tabIndex={0}
                  data-testid={`participation-${opt.id}`}
                  sx={cardSx(opt.selected)}
                  onClick={opt.onClick}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      opt.onClick();
                    }
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack spacing={1} alignItems="center" textAlign="center">
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {t(opt.titleKey)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t(opt.descKey)}
                      </Typography>
                      {opt.selected && (
                        <Chip label={t('selected')} color="primary" size="small" sx={{ mt: 1 }} />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {showGender && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
            <Trans i18nKey="yourGender" />
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <Trans i18nKey="anatomyDescription" />
          </Typography>
          <Grid container spacing={2}>
            {genderOptions.map((option) => (
              <Grid size={{ xs: 12, sm: 4 }} key={option.value}>
                <Card
                  role="button"
                  tabIndex={0}
                  sx={cardSx(formData.gender === option.value)}
                  onClick={() => setFormData({ ...formData, gender: option.value as PlayerGender })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setFormData({ ...formData, gender: option.value as PlayerGender });
                    }
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack spacing={1} alignItems="center" textAlign="center">
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {t(option.labelKey)}
                      </Typography>
                      {formData.gender === option.value && (
                        <Chip label={t('selected')} color="primary" size="small" sx={{ mt: 1 }} />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {showRole && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            <Trans i18nKey="yourRole" />
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {roleOptions.map((role) => (
              <Grid size={{ xs: 12, sm: 4 }} key={role.value}>
                <Card
                  role="button"
                  tabIndex={0}
                  sx={cardSx(formData.role === role.value)}
                  onClick={() => setFormData({ ...formData, role: role.value as PlayerRole })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setFormData({ ...formData, role: role.value as PlayerRole });
                    }
                  }}
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
        </Box>
      )}

      {showNaked && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            <Trans i18nKey="areYouNaked" />
          </Typography>
          <Grid container spacing={2}>
            {intensityModes.map((mode) => (
              <Grid size={{ xs: 12, sm: 6 }} key={mode.id}>
                <Card
                  role="button"
                  tabIndex={0}
                  sx={cardSx(mode.isSelected)}
                  onClick={() => setFormData({ ...formData, isNaked: mode.id === 'naked' })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setFormData({ ...formData, isNaked: mode.id === 'naked' });
                    }
                  }}
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
      )}

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
