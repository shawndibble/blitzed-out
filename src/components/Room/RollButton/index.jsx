import { Casino } from '@mui/icons-material';
import { Fab } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function RollButton({ setRollValue }) {
  const { t } = useTranslation();
  const [isDisabled, setDisabled] = useState(false);

  function roll() {
    setRollValue([Math.floor(Math.random() * 4) + 1]);
    setDisabled(true);
    setTimeout(() => setDisabled(false), 4000);
  }

  return (
    <Fab
      variant="extended"
      size="medium"
      aria-label={t('roll')}
      onClick={() => roll()}
      className="dice-roller"
      disabled={isDisabled}
    >
      <Casino />
      {' '}
      {isDisabled ? t('wait') : t('roll')}
    </Fab>
  );
}
