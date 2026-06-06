import { Box, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import actionStringReplacement from '@/services/actionStringReplacement';
import { normalizePlaceholders } from '@/services/placeholderAliasService';
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

    // Author may type tokens in their own language; the replacement pipeline
    // only understands canonical English tokens.
    const canonicalAction = normalizePlaceholders(trimmedAction, settings.locale || 'en');

    return actionStringReplacement(
      canonicalAction,
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
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
        }}
      >
        {t('customTiles.preview.title')}
      </Typography>
      <Typography variant="body2">{preview}</Typography>
    </Box>
  );
}
