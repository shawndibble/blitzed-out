import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
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

interface FinishStepProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
  prevStep: () => void;
  actionsList: Record<string, any>;
  close?: () => void;
  /** Wizard funnel: called with the selected-group count on successful submit. */
  onCompleted?: (groupCount: number) => void;
}

const generateRoomCode = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 5);

/**
 * Board-length quick picks surfaced in the wizard (tile counts). Advanced
 * settings keep a granular tile control; these are the simple fast-lane presets.
 * A persisted value outside this set (e.g. 60 from advanced) is left untouched —
 * the toggle simply shows no preset selected until the user picks one.
 */
const TILE_BUCKETS = [
  { value: 20, labelKey: 'gameLength.short', fallback: 'Short' },
  { value: 45, labelKey: 'gameLength.medium', fallback: 'Medium' },
  { value: 70, labelKey: 'gameLength.long', fallback: 'Long' },
] as const;

export default function FinishStep({
  formData,
  setFormData,
  prevStep,
  actionsList,
  close,
  onCompleted,
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

      onCompleted?.(Object.keys(formData.selectedActions || {}).length);

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

  const isPublicRoomSelected = !formData.room || formData.room === 'PUBLIC';

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
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        {t('gameLength.title', 'Game length')}
      </Typography>
      <ToggleButtonGroup
        exclusive
        color="primary"
        value={formData.roomTileCount ?? null}
        onChange={(_event, value: number | null) => {
          if (value != null) {
            setFormData({ ...formData, roomTileCount: value, boardUpdated: true });
          }
        }}
        aria-label={t('gameLength.title', 'Game length')}
        sx={{ mb: 1, flexWrap: 'wrap' }}
      >
        {TILE_BUCKETS.map((bucket) => (
          <ToggleButton key={bucket.value} value={bucket.value} sx={{ px: 3 }}>
            {t(bucket.labelKey, bucket.fallback)} · {bucket.value}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
        {t('gameLength.helper', 'A longer board means a longer game.')}
      </Typography>

      {formData.gameMode === 'solo' && (
        <>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            {t('soloPrivacy.title', 'Where do you want to play?')}
          </Typography>
          <ToggleButtonGroup
            exclusive
            color="primary"
            value={isPublicRoomSelected ? 'public' : 'private'}
            onChange={(_event, value: 'public' | 'private' | null) => {
              if (value === 'public') {
                setFormData({ ...formData, room: 'PUBLIC', roomRealtime: true });
              } else if (value === 'private') {
                setFormData({
                  ...formData,
                  room:
                    formData.room && formData.room !== 'PUBLIC'
                      ? formData.room
                      : generateRoomCode(),
                  roomRealtime: false,
                });
              }
            }}
            aria-label={t('soloPrivacy.title', 'Where do you want to play?')}
            sx={{ mb: 1, flexWrap: 'wrap' }}
          >
            <ToggleButton value="public" sx={{ px: 3 }}>
              {t('soloPrivacy.publicTitle', 'Public room')}
            </ToggleButton>
            <ToggleButton value="private" sx={{ px: 3 }}>
              {t('soloPrivacy.privateTitle', 'Private room')}
            </ToggleButton>
          </ToggleButtonGroup>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
            {isPublicRoomSelected
              ? t(
                  'soloPrivacy.publicDesc',
                  'Play in the shared PUBLIC room — see the chat and boards of others.'
                )
              : t('soloPrivacy.privateDesc', 'Your own room code — completely to yourself.')}
          </Typography>
        </>
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
