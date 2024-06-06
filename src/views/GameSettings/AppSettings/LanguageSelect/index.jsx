import { Language } from '@mui/icons-material';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import languages from 'locales/languages.json';

export default function LanguageSelect({ boardUpdated }) {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.resolvedLanguage);

  function changeLanguage(value) {
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
        <InputLabel
          id="language-label"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
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
          onChange={(event) => changeLanguage(event.target.value)}
        >
          {menuItems}
        </Select>
      </FormControl>
    </Box>
  );
}
