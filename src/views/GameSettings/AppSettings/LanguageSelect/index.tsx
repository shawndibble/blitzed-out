import { Language } from '@mui/icons-material';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  CircularProgress,
} from '@mui/material';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { languages } from '@/services/i18nHelpers';
import { useDeferredMigration } from '@/hooks/useDeferredMigration';

interface LanguageSelectProps {
  boardUpdated: () => void;
}

export default function LanguageSelect({ boardUpdated }: LanguageSelectProps): JSX.Element {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<string>(i18n.resolvedLanguage || 'en');
  const [loading, setLoading] = useState<boolean>(false);
  const { ensureLanguage } = useDeferredMigration();

  async function changeLanguage(value: string): Promise<void> {
    setLoading(true);
    setLanguage(value);

    try {
      // Ensure the new language is migrated before switching
      await ensureLanguage(value);
      await i18n.changeLanguage(value);
      boardUpdated();
    } catch (error) {
      console.error('Error changing language:', error);
      // Still attempt to change language even if migration fails
      await i18n.changeLanguage(value);
      boardUpdated();
    } finally {
      setLoading(false);
    }
  }

  const menuItems = Object.entries(languages).map(([key, obj]) => (
    <MenuItem value={key} key={key}>
      {obj.label}
    </MenuItem>
  ));

  return (
    <Box sx={{ minWidth: 120, mt: 1, mb: 2 }}>
      <FormControl fullWidth>
        <InputLabel id="language-label" sx={{ display: 'flex', alignItems: 'center' }}>
          <Language sx={{ mr: 1 }} />
          <Trans i18nKey="language" />
        </InputLabel>
        <Select
          labelId="language-label"
          id="language-select"
          value={language}
          disabled={loading}
          label={
            <>
              <Language />
              <Trans i18nKey="language" />
            </>
          }
          onChange={(event: SelectChangeEvent<string>) => changeLanguage(event.target.value)}
          endAdornment={loading && <CircularProgress size={20} />}
          MenuProps={{
            disableScrollLock: true,
            BackdropProps: {
              invisible: true,
            },
            PaperProps: {
              style: {
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none',
              },
            },
          }}
        >
          {menuItems}
        </Select>
      </FormControl>
    </Box>
  );
}
