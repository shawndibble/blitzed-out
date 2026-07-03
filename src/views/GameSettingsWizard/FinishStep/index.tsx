import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { customAlphabet } from 'nanoid';

import ButtonRow from '@/components/ButtonRow';
import { Settings } from '@/types/Settings';
import { arraysEqual } from '@/helpers/arrays';
import useSubmitGameSettings from '@/hooks/useSubmitGameSettings';
import { useParams } from 'react-router-dom';
import { analytics } from '@/services/analytics';
import { markWizardCompleted } from '@/hooks/useWizardAnalytics';
import { isPublicRoom } from '@/helpers/strings';

interface FinishStepProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
  prevStep: () => void;
  actionsList: Record<string, any>;
  close?: () => void;
}

const generateRoomCode = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 5);

export default function FinishStep({
  formData,
  setFormData,
  prevStep,
  actionsList,
  close,
}: FinishStepProps): JSX.Element {
  const no: [number, number] = [100, 100];
  const yes: [number, number] = [0, 0];
  const [yesFinishRange, setYesFinishRange] = useState<boolean>(
    arraysEqual(formData?.finishRange || [], yes)
  );
  const { submit: submitSettings, isSubmitting: isLoading } = useSubmitGameSettings();
  const { t } = useTranslation();
  const { id: currentRoom } = useParams<{ id: string }>();

  // on load, if don't have a finishRange OR if it is something from advanced settings, replace it.
  useEffect(() => {
    let newData = {
      ...formData,
      boardUpdated: true,
    };
    if (!yesFinishRange || !arraysEqual(formData.finishRange || [], no)) {
      newData.finishRange = no;
    }
    setFormData(newData);
  }, []);

  const handleSubmit = async (): Promise<void> => {
    try {
      await submitSettings(formData, actionsList);

      markWizardCompleted();
      analytics.trackWizardCompleted(
        formData.gameMode || 'online',
        isPublicRoom(formData.room || 'PUBLIC') ? 'public' : 'private',
        Object.keys(formData.selectedActions || {}).length
      );

      const willNavigate =
        currentRoom !== undefined && currentRoom?.toUpperCase() !== formData.room?.toUpperCase();

      if (typeof close === 'function') {
        if (willNavigate) {
          // eslint-disable-next-line @eslint-react/dom-no-flush-sync -- Intentional: ensures DOM is reconciled before route change
          flushSync(() => {
            close();
          });
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        } else {
          close();
        }
      }
    } catch {
      if (typeof close === 'function') {
        close();
      }
    }
  };

  const orgasmOptions = [
    {
      id: 'noOrgasm',
      title: 'noOrgasm',
      description: t('noOrgasmDesc'),
      isSelected: !yesFinishRange,
    },
    {
      id: 'yesOrgasm',
      title: 'yesOrgasm',
      description: t('yesOrgasmDesc'),
      isSelected: yesFinishRange,
    },
  ];

  return (
    <Box sx={{ minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        <Trans i18nKey="WillYouOrgasm" />
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {orgasmOptions.map((option) => (
          <Grid size={{ xs: 12, sm: 6 }} key={option.id}>
            <Card
              sx={{
                cursor: 'pointer',
                border: option.isSelected ? '3px solid' : '1px solid',
                borderColor: option.isSelected ? 'primary.main' : 'divider',
                backgroundColor: option.isSelected ? 'primary.50' : 'background.paper',
                transition: 'all 0.2s ease-in-out',
                height: '100%',
                transform: option.isSelected ? 'scale(1.02)' : 'scale(1)',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'scale(1.02)',
                  boxShadow: 2,
                },
              }}
              onClick={() => {
                const newValue = option.id === 'yesOrgasm';
                setFormData({
                  ...formData,
                  finishRange: newValue ? yes : no,
                });
                setYesFinishRange(newValue);
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack
                  spacing={1}
                  sx={{
                    alignItems: 'center',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t(option.title)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                    }}
                  >
                    {option.description}
                  </Typography>
                  {option.isSelected && (
                    <Chip label={t('selected')} color="primary" size="small" sx={{ mt: 1 }} />
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {formData.gameMode === 'solo' && (
        <FormControlLabel
          sx={{ mb: 2 }}
          control={
            <Checkbox
              checked={formData.room !== 'PUBLIC'}
              onChange={(event) => {
                const isPrivate = event.target.checked;
                setFormData({
                  ...formData,
                  room: isPrivate ? generateRoomCode() : 'PUBLIC',
                  roomRealtime: !isPrivate,
                });
              }}
            />
          }
          label={t('playerTopology.solo.private', 'Play privately')}
        />
      )}
      <Box sx={{ flexGrow: 1 }} />
      <ButtonRow>
        <Button onClick={prevStep} disabled={isLoading}>
          <Trans i18nKey="previous" />
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
          size="large"
          sx={{ px: 4 }}
        >
          <Trans i18nKey="buildGame" />
        </Button>
      </ButtonRow>
    </Box>
  );
}
