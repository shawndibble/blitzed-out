import PropTypes from 'prop-types';
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
  const [minTime, setMinTime] = useState(30);
  const [maxTime, setMaxTime] = useState(120);

  const handleSubmit = () => {
    if (isRangeMode) {
      // For range mode, calculate a random time between min and max
      let min = Number.parseInt(minTime, 10);
      let max = Number.parseInt(maxTime, 10);
      
      // Validate min and max
      if (Number.isNaN(min) || min < MIN_SECONDS) {
        min = MIN_SECONDS;
        setMinTime(min);
      }
      
      if (Number.isNaN(max) || max < min) {
        max = min;
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
      if (Number.isNaN(time) || time < MIN_SECONDS) {
        time = MIN_SECONDS;
        setCustomTime(time);
      } else if (isMinutes) {
        time *= 60; // Convert minutes to seconds
      }
      time = Math.max(time, MIN_SECONDS);
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
            control={<Switch checked={isRangeMode} onChange={(e) => setIsRangeMode(e.target.checked)} />}
            label={t('useRandomRange')}
          />
        </Box>
        
        {isRangeMode ? (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t('randomTimerRange')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label={t('minValue')}
                type="number"
                value={minTime}
                onChange={(e) => setMinTime(e.target.value)}
                fullWidth
                inputProps={{ min: 5, max: isMinutes ? 60 : 3600 }}
              />
              <Typography variant="body1" sx={{ alignSelf: 'center' }}>-</Typography>
              <TextField
                label={t('maxValue')}
                type="number"
                value={maxTime}
                onChange={(e) => setMaxTime(e.target.value)}
                fullWidth
                inputProps={{ min: 5, max: isMinutes ? 60 : 3600 }}
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
        )}
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
