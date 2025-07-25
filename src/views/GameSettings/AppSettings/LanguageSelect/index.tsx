import { Language } from '@mui/icons-material';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useState, useEffect, useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import localeService, { LocaleMetadata } from '@/services/localeService';
import { useSettingsStore } from '@/stores/settingsStore';

interface LanguageSelectProps {
  boardUpdated: () => void;
}

export default function LanguageSelect({ boardUpdated }: LanguageSelectProps): JSX.Element {
  const { i18n } = useTranslation();
  const { setLocale } = useSettingsStore();
  const [language, setLanguage] = useState<string>(i18n.resolvedLanguage || 'en');
  const [availableLanguages, setAvailableLanguages] = useState<LocaleMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available languages on component mount
  useEffect(() => {
    const languages = localeService.getAvailableLanguages();
    setAvailableLanguages(languages);
  }, []);

  const changeLanguage = useCallback(
    async (value: string): Promise<void> => {
      if (value === language) return;

      setIsLoading(true);
      setError(null);

      try {
        // Load the language resources if not already loaded
        await localeService.loadLanguage(value);

        // Change the i18n language
        await i18n.changeLanguage(value);

        // Save preference
        localeService.saveLanguagePreference(value);

        // Ensure the new locale's data is migrated
        const { migrateLocaleIfNeeded } = await import('@/services/migrationService');
        const migrationSuccess = await migrateLocaleIfNeeded(value);

        if (!migrationSuccess) {
          console.warn(`Migration failed for locale ${value}, but continuing with language switch`);
        }

        // Update settings store with new locale - this will trigger UI components to refresh
        setLocale(value);

        // Update local state
        setLanguage(value);

        // Notify parent component
        boardUpdated();

        // Update available languages to reflect new status
        const updatedLanguages = localeService.getAvailableLanguages();
        setAvailableLanguages(updatedLanguages);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to change language';
        setError(errorMessage);
        console.error('Language change error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [language, i18n, boardUpdated]
  );

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    changeLanguage(event.target.value);
  };

  const menuItems = availableLanguages.map((metadata) => {
    const isCurrentlyLoading = metadata.status === 'loading';
    const hasError = metadata.status === 'error';

    return (
      <MenuItem
        value={metadata.code}
        key={metadata.code}
        disabled={isCurrentlyLoading}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: hasError ? 'error.main' : 'inherit',
        }}
      >
        <span>{metadata.label}</span>
        {isCurrentlyLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
        {hasError && <span style={{ fontSize: '0.8em', opacity: 0.7 }}>(Error)</span>}
      </MenuItem>
    );
  });

  return (
    <Box sx={{ minWidth: 120, mt: 1, mb: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <FormControl fullWidth disabled={isLoading}>
        <InputLabel id="language-label" sx={{ display: 'flex', alignItems: 'center' }}>
          <Language sx={{ mr: 1 }} />
          <Trans i18nKey="language" />
          {isLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
        </InputLabel>
        <Select
          labelId="language-label"
          id="language-select"
          value={language}
          label={
            <>
              <Language />
              <Trans i18nKey="language" />
              {isLoading && <CircularProgress size={16} />}
            </>
          }
          onChange={handleLanguageChange}
          disabled={isLoading}
        >
          {menuItems}
        </Select>
      </FormControl>
    </Box>
  );
}
