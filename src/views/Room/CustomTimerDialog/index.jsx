import PropTypes from 'prop-types';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
} from '@mui/material';
import { ChangeCircle } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

/**
 * Dialog component for setting a custom timer value in seconds
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls dialog visibility
 * @param {Function} props.onClose - Callback when dialog is closed
 * @param {Function} props.onSubmit - Callback when timer value is submitted
 */
const CustomTimerDialog = ({ isOpen, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [customTime, setCustomTime] = useState(30);
  const [isMinutes, setIsMinutes] = useState(false);

  const handleSubmit = () => {
    let time = Number.parseInt(customTime, 10);
    if (!Number.isNaN(time) && time > 0) {
      if (isMinutes) {
        time *= 60; // Convert minutes to seconds
      }
      // ensure the time is no lower than 5 seconds
    } else {
      time = 10;
    }
    time = Math.max(time, 10);
    onSubmit(time);
    onClose();
  };

  const toggleTimeUnit = () => {
    setCustomTime((prevTime) => {
      const time = Number.parseFloat(prevTime);
      if (Number.isNaN(time) || time <= 0) return prevTime;

      if (isMinutes) {
        // Convert minutes to seconds
        return (time * 60).toString();
      } else {
        // Convert seconds to minutes
        return (time / 60).toString();
      }
    });
    setIsMinutes((prev) => !prev);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xs">
      <DialogTitle>{t('setTimer')}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          type="number"
          value={customTime}
          onChange={(e) => setCustomTime(e.target.value)}
          sx={{ width: '15rem' }}
          inputProps={{ min: 5, max: isMinutes ? 60 : 3600 }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Button onClick={toggleTimeUnit} variant="text">
                    {isMinutes ? t('minutes') : t('seconds')}
                    <ChangeCircle sx={{ ml: 1 }} />
                  </Button>
                </InputAdornment>
              ),
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

CustomTimerDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default CustomTimerDialog;
