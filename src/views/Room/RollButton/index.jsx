import { Casino } from '@mui/icons-material';
import { Button, ButtonGroup } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './styles.css';
import useCountdown from '@/hooks/useCountdown';
import RollOptionsMenu from '../RollOptionsMenu';
import CustomTimerDialog from '../CustomTimerDialog';

function isNumeric(value) {
  return /^-?\d+$/.test(value);
}

function rollDice(rollCount, diceSide, updateRollValue) {
  let total = 0;
  for (let i = 0; i < Number(rollCount); i += 1) {
    total += Number([Math.floor(Math.random() * Number(diceSide)) + 1]);
  }
  updateRollValue(total);
}

const RollButton = function memo({ setRollValue, dice, isEndOfBoard }) {
  const { t } = useTranslation();
  const [isDisabled, setDisabled] = useState(false);
  const [selectedRoll, setSelectedRoll] = useState('manual');
  const [autoTime, setAutoTime] = useState(0);
  const [rollText, setRollText] = useState(t('roll'));
  const { timeLeft, setTimeLeft, togglePause, isPaused } = useCountdown(autoTime);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [timerSettings, setTimerSettings] = useState({ isRange: false, min: 30, max: 120 });

  const updateRollValue = useCallback((value) => {
    setRollValue({ value, time: Date.now() });
  }, []);

  const options = useMemo(() => {
    const opts = new Map();
    opts
      .set('restart', t('restart'))
      .set('manual', t('manual'))
      .set(30, t('auto30'))
      .set(60, t('auto60'))
      .set(90, t('auto90'))
      .set('custom', t('setTimer'));
    return opts;
  }, []);

  const [rollCount, diceSide] = dice.split('d');

  const handleClick = () => {
    if (selectedRoll === 'manual') {
      rollDice(rollCount, diceSide, updateRollValue);
      setDisabled(true);
      setTimeout(() => setDisabled(false), 4000);
      return null;
    }

    if (isPaused && timeLeft === autoTime) {
      rollDice(rollCount, diceSide, updateRollValue);
    }
    togglePause();
    return null;
  };

  const handleMenuItemClick = useCallback(
    (key) => {
      if (key === 'restart') {
        return updateRollValue(-1);
      }

      setSelectedRoll(key);

      if (key === 'custom') {
        setDialogOpen(true);
        return null;
      }

      if (isNumeric(key)) {
        if (!isPaused) togglePause();
        setAutoTime(key);
        setTimeLeft(key);
      }
      return null;
    },
    [isPaused, setTimeLeft, togglePause]
  );

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleDialogSubmit = (time, settings = { isRange: false }) => {
    if (!isPaused) togglePause();
    setAutoTime(time);
    setTimeLeft(time);
    setTimerSettings(settings);
    setSelectedRoll('custom');
    setDialogOpen(false);
  };

  useEffect(() => {
    if (isEndOfBoard) {
      togglePause();
    }
  }, [isEndOfBoard]);

  useEffect(() => {
    if (isDisabled) return setRollText(t('wait'));
    if (selectedRoll === 'manual') {
      return setRollText(t('roll'));
    }

    if (isPaused) return setRollText(`${t('play')} (${timeLeft})`);

    if (timeLeft > 0) {
      return setRollText(`${t('pause')} (${timeLeft})`);
    }

    rollDice(rollCount, diceSide, updateRollValue);
    
    // If using random range, generate a new random time for the next roll
    if (timerSettings.isRange) {
      const { min, max } = timerSettings;
      const newRandomTime = Math.floor(Math.random() * (max - min + 1)) + min;
      setAutoTime(newRandomTime);
      return setTimeLeft(newRandomTime);
    }
    
    return setTimeLeft(autoTime);
  }, [isDisabled, selectedRoll, timeLeft, autoTime, isPaused]);

  return (
    <>
      <ButtonGroup variant="contained" className="dice-roller">
        <Button aria-label={t('roll')} onClick={handleClick} disabled={isDisabled} size="large">
          <Casino sx={{ mr: 1 }} />
          {rollText}
        </Button>
        <RollOptionsMenu
          options={options}
          selectedRoll={selectedRoll}
          handleMenuItemClick={handleMenuItemClick}
        />
      </ButtonGroup>
      <CustomTimerDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
      />
    </>
  );
};

export default RollButton;
