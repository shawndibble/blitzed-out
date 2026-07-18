import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { JSX, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface AutoRollTimerSettings {
  isRange: boolean;
  min: number;
  max: number;
}

interface AutoRollDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectFixed: (seconds: number) => void;
  onSelectCustom: (time: number, settings: AutoRollTimerSettings) => void;
  /** Current roll mode key: '30' | '60' | '90' | 'custom' | anything else. */
  selected?: string;
}

const MIN_SECONDS = 10;
const PRESETS = ['30', '60', '90'] as const;

/**
 * Single entry point for auto-roll cadence: fixed presets (30/60/90s) apply
 * immediately, "Custom" reveals the free-form/range controls. Replaces the
 * separate Auto 30/60/90 menu items and Custom Timer dialog.
 */
export default function AutoRollDialog({
  open,
  onClose,
  onSelectFixed,
  onSelectCustom,
  selected,
}: AutoRollDialogProps): JSX.Element {
  const { t } = useTranslation();
  const [mode, setMode] = useState<string | null>(
    selected && ((PRESETS as readonly string[]).includes(selected) || selected === 'custom')
      ? selected
      : null
  );
  const [customTime, setCustomTime] = useState<number | string>(30);
  const [isMinutes, setIsMinutes] = useState<boolean>(false);
  const [isRangeMode, setIsRangeMode] = useState<boolean>(false);
  const [minTime, setMinTime] = useState<number | string>(20);
  const [maxTime, setMaxTime] = useState<number | string>(60);

  const numberInputSx = {
    '& input[type=number]': { MozAppearance: 'textfield' },
    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
      {
        WebkitAppearance: 'none',
        margin: 0,
      },
  } as const;

  const getNumberInputSlotProps = (endAdornment?: ReactNode) =>
    ({
      input: {
        endAdornment,
        inputProps: {
          inputMode: 'numeric' as const,
          pattern: '[0-9]*' as const,
        },
      },
    }) as const;

  const handlePresetChange = (_: unknown, value: string | null): void => {
    if (!value) return;
    setMode(value);
    onSelectFixed(Number(value));
    onClose();
  };

  const handleCustomSubmit = (): void => {
    if (isRangeMode) {
      let min = Number.parseInt(String(minTime), 10);
      let max = Number.parseInt(String(maxTime), 10);

      if (Number.isNaN(min)) {
        min = isMinutes ? 1 : MIN_SECONDS;
        setMinTime(min);
      } else if (!isMinutes && min < MIN_SECONDS) {
        min = MIN_SECONDS;
      }

      if (Number.isNaN(max) || max < min) {
        max = min;
        setMaxTime(max);
      } else if (max === 0) {
        max = 180;
        setMaxTime(max);
      }

      if (isMinutes) {
        min *= 60;
        max *= 60;
      }

      const randomTime = Math.floor(Math.random() * (max - min + 1)) + min;
      onSelectCustom(randomTime, { isRange: true, min, max });
    } else {
      let time = Number.parseInt(String(customTime), 10);
      if (Number.isNaN(time)) {
        time = isMinutes ? 1 : MIN_SECONDS;
        setCustomTime(time);
      } else if (isMinutes) {
        time *= 60;
      } else if (time < MIN_SECONDS) {
        time = MIN_SECONDS;
      }
      onSelectCustom(time, { isRange: false, min: time, max: time });
    }
    onClose();
  };

  const toggleTimeUnit = (): void => {
    setCustomTime((prevTime) => {
      const time = Number.parseFloat(String(prevTime));
      if (Number.isNaN(time) || time <= 0) return prevTime;
      return isMinutes ? (time * 60).toString() : (time / 60).toString();
    });

    setMinTime((prevTime) => {
      const time = Number.parseFloat(String(prevTime));
      if (Number.isNaN(time) || time <= 0) return prevTime;
      return isMinutes ? (time * 60).toString() : (time / 60).toString();
    });

    setMaxTime((prevTime) => {
      const time = Number.parseFloat(String(prevTime));
      if (Number.isNaN(time) || time <= 0) return prevTime;
      return isMinutes ? (time * 60).toString() : (time / 60).toString();
    });

    setIsMinutes((prev) => !prev);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="auto-roll-dialog-title"
    >
      <DialogTitle id="auto-roll-dialog-title">{t('autoRoll')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {t('customTimerHint', 'Set how often the dice roll automatically.')}
        </Typography>

        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={(PRESETS as readonly string[]).includes(mode ?? '') ? mode : null}
          onChange={handlePresetChange}
          aria-label={t('autoRoll')}
          sx={{ mb: 1 }}
        >
          {PRESETS.map((seconds) => (
            <ToggleButton key={seconds} value={seconds}>
              {t(`shortAuto${seconds}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Button
          fullWidth
          variant={mode === 'custom' ? 'contained' : 'outlined'}
          onClick={() => setMode('custom')}
          sx={{ mb: 2 }}
        >
          {t('customOption', 'Custom…')}
        </Button>

        {mode === 'custom' && (
          <Box>
            <Box
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
            >
              <Typography>{t('useRandomRange')}</Typography>
              <Switch
                checked={isRangeMode}
                onChange={(e) => setIsRangeMode(e.target.checked)}
                slotProps={{ input: { 'aria-label': t('useRandomRange') } }}
              />
            </Box>

            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={isMinutes ? 'minutes' : 'seconds'}
              onChange={(_, value) => {
                if (value && value !== (isMinutes ? 'minutes' : 'seconds')) toggleTimeUnit();
              }}
              aria-label={t('customTimerUnit', 'Unit')}
              sx={{ mb: 2 }}
            >
              <ToggleButton value="seconds">{t('seconds')}</ToggleButton>
              <ToggleButton value="minutes">{t('minutes')}</ToggleButton>
            </ToggleButtonGroup>

            {isRangeMode ? (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t('randomTimerRange')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TextField
                    label={t('minValue')}
                    type="number"
                    value={minTime}
                    onChange={(e) => setMinTime(parseInt(e.target.value, 10))}
                    fullWidth
                    sx={numberInputSx}
                    slotProps={getNumberInputSlotProps()}
                  />
                  <Typography variant="body1" sx={{ alignSelf: 'center' }}>
                    -
                  </Typography>
                  <TextField
                    label={t('maxValue')}
                    type="number"
                    value={maxTime}
                    onChange={(e) =>
                      setMaxTime(Math.max(Number(minTime), parseInt(e.target.value, 10)))
                    }
                    fullWidth
                    sx={numberInputSx}
                    slotProps={getNumberInputSlotProps()}
                  />
                </Box>
              </Box>
            ) : (
              <TextField
                autoFocus
                type="number"
                label={isMinutes ? t('minutes') : t('seconds')}
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                fullWidth
                sx={numberInputSx}
                slotProps={getNumberInputSlotProps(
                  <InputAdornment position="end">
                    {isMinutes ? t('minutes') : t('seconds')}
                  </InputAdornment>
                )}
              />
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        {mode === 'custom' ? (
          <>
            <Button onClick={onClose} variant="outlined">
              {t('cancel')}
            </Button>
            <Button onClick={handleCustomSubmit} variant="contained" autoFocus>
              {t('set')}
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>{t('done', 'Done')}</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
