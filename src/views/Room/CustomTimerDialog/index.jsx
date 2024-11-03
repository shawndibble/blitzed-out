import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const CustomTimerDialog = ({ isOpen, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [customTime, setCustomTime] = useState('');

  const handleSubmit = () => {
    const time = parseInt(customTime, 10);
    if (!isNaN(time) && time > 0) {
      onSubmit(time);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>{t('setTimer')}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          type="number"
          fullWidth
          value={customTime}
          onChange={(e) => setCustomTime(e.target.value)}
          slotProps={{
            input: {
              endAdornment: <InputAdornment position="end">{t('seconds')}</InputAdornment>,
            },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button onClick={handleSubmit}>{t('set')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomTimerDialog;
