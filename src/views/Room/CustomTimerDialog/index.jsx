import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Typography,
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
const MIN_SECONDS = 10;

const CustomTimerDialog = ({ isOpen, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [customTime, setCustomTime] = useState(30);
  const [isMinutes, setIsMinutes] = useState(false);
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [minTime, setMinTime] = useState(20);
  const [maxTime, setMaxTime] = useState(60);

  const handleSubmit = () => {
    if (isRangeMode) {
      // For range mode, calculate a random time between min and max
      let min = Number.parseInt(minTime, 10);
      let max = Number.parseInt(maxTime, 10);

      // Validate min and max
      if (Number.isNaN(min)) {
        min = isMinutes ? 1 : MIN_SECONDS;
        setMinTime(min);
      } else if (!isMinutes && min < MIN_SECONDS) {
        // Only enforce minimum in seconds mode
        min = MIN_SECONDS;
      }

      if (Number.isNaN(max) || max < min) {
        max = min;
        setMaxTime(max);
      } else if (max === 0) {
        // If max is not provided, set to 3 minutes (in seconds)
        max = 180;
        setMaxTime(max);
      }

      // Convert to seconds if in minutes mode
      if (isMinutes) {
        min *= 60;
        max *= 60;
      }

      // Generate a random time between min and max
      const randomTime = Math.floor(Math.random() * (max - min + 1)) + min;
      onSubmit(randomTime, { isRange: true, min, max });
    } else {
      // For fixed time mode
      let time = Number.parseInt(customTime, 10);
      if (Number.isNaN(time)) {
        time = isMinutes ? 1 : MIN_SECONDS;
        setCustomTime(time);
      } else if (isMinutes) {
        time *= 60; // Convert minutes to seconds
      } else if (time < MIN_SECONDS) {
        // Only enforce minimum in seconds mode
        time = MIN_SECONDS;
      }
      onSubmit(time, { isRange: false });
    }
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

    // Also convert min and max times
    setMinTime((prevTime) => {
      const time = Number.parseFloat(prevTime);
      if (Number.isNaN(time) || time <= 0) return prevTime;

      if (isMinutes) {
        return (time * 60).toString();
      } else {
        return (time / 60).toString();
      }
    });

    setMaxTime((prevTime) => {
      const time = Number.parseFloat(prevTime);
      if (Number.isNaN(time) || time <= 0) return prevTime;

      if (isMinutes) {
        return (time * 60).toString();
      } else {
        return (time / 60).toString();
      }
    });

    setIsMinutes((prev) => !prev);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xs">
      <DialogTitle>{t('setTimer')}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch checked={isRangeMode} onChange={(e) => setIsRangeMode(e.target.checked)} />
            }
            label={t('useRandomRange')}
          />
        </Box>

        {isRangeMode ? (
          <Box>
            <Typography variant="subtitle2">{t('randomTimerRange')}</Typography>
            <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
              <TextField
                label={t('minValue')}
                type="number"
                value={minTime}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  setMinTime(value);
                }}
                fullWidth
                slotProps={{ input: { min: 1 } }}
              />
              <Typography variant="body1" sx={{ alignSelf: 'center' }}>
                -
              </Typography>
              <TextField
                label={t('maxValue')}
                type="number"
                value={maxTime}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  // Ensure max is at least equal to min
                  setMaxTime(Math.max(minTime, value));
                }}
                fullWidth
                slotProps={{ input: { min: minTime } }}
              />
            </Box>
            <Button onClick={toggleTimeUnit} variant="outlined" size="small">
              {isMinutes ? t('minutes') : t('seconds')}
              <ChangeCircle sx={{ ml: 1 }} />
            </Button>
          </Box>
        ) : (
          <TextField
            autoFocus
            type="number"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            sx={{ width: '15rem' }}
            slotProps={{
              input: {
                min: 1,
                max: isMinutes ? 60 : 3600,
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
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button onClick={handleSubmit}>{t('set')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomTimerDialog;
