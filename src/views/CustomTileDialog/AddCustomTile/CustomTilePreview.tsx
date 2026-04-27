import { Box, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import actionStringReplacement from '@/services/actionStringReplacement';
import { Settings } from '@/types/Settings';

interface CustomTilePreviewProps {
  action: string;
  settings: Settings;
}

export default function CustomTilePreview({
  action,
  settings,
}: CustomTilePreviewProps): JSX.Element | null {
  const { t } = useTranslation();
  const trimmedAction = action.trim();

  const preview = useMemo(() => {
    if (!trimmedAction) return '';

    return actionStringReplacement(
      trimmedAction,
      settings.role || 'sub',
      '',
      undefined,
      true,
      settings.gender,
      settings.locale
    );
  }, [trimmedAction, settings.role, settings.gender, settings.locale]);

  if (!trimmedAction) return null;

  return (
    <Box
      sx={{
        px: 1,
        py: 0.75,
        mb: 2,
        borderLeft: 3,
        borderColor: 'primary.main',
        bgcolor: 'action.hover',
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {t('customTiles.preview.title')}
      </Typography>
      <Typography variant="body2">{preview}</Typography>
    </Box>
  );
}
