import { Language } from '@mui/icons-material';
import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { languages } from '@/services/i18nHelpers';

interface LanguageSelectProps {
  boardUpdated: () => void;
}

export default function LanguageSelect({ boardUpdated }: LanguageSelectProps): JSX.Element {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<string>(i18n.resolvedLanguage || 'en');

  function changeLanguage(value: string): void {
    setLanguage(value);
    i18n.changeLanguage(value);
    boardUpdated();
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
          label={
            <>
              <Language />
              <Trans i18nKey="language" />
            </>
          }
          onChange={(event: SelectChangeEvent<string>) => changeLanguage(event.target.value)}
        >
          {menuItems}
        </Select>
      </FormControl>
    </Box>
  );
}
