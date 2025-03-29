import { Casino } from '@mui/icons-material';
import { Button, ButtonGroup } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './styles.css';
import useCountdown from '@/hooks/useCountdown';
import RollOptionsMenu from '../RollOptionsMenu';
import CustomTimerDialog from '../CustomTimerDialog';

interface RollButtonProps {
  setRollValue: (value: number) => void;
  dice: string;
  isEndOfBoard: boolean;
}

interface TimerSettings {
  isRange: boolean;
  min: number;
  max: number;
}

function isNumeric(value: string | number): boolean {
  return /^-?\d+$/.test(String(value));
}

function rollDice(
  rollCount: string,
  diceSide: string,
  updateRollValue: (value: number) => void
): void {
  let total = 0;
  for (let i = 0; i < Number(rollCount); i += 1) {
    total += Math.floor(Math.random() * Number(diceSide)) + 1;
  }
  updateRollValue(total);
}

const RollButton = function memo({
  setRollValue,
  dice,
  isEndOfBoard,
}: RollButtonProps): JSX.Element {
  const { t } = useTranslation();
  const [isDisabled, setDisabled] = useState<boolean>(false);
  const [selectedRoll, setSelectedRoll] = useState<string>('manual');
  const [autoTime, setAutoTime] = useState<number>(0);
  const [rollText, setRollText] = useState<string>(t('roll'));
  const { timeLeft, setTimeLeft, togglePause, isPaused } = useCountdown(autoTime);
  const [isDialogOpen, setDialogOpen] = useState<boolean>(false);
  const [timerSettings, setTimerSettings] = useState<TimerSettings>({
    isRange: false,
    min: 30,
    max: 120,
  });

  const updateRollValue = useCallback(
    (value: number): void => {
      setRollValue(value);
    },
    [setRollValue]
  );

  const [rollCount, diceSide] = dice.split('d');

  const handleClick = (): void => {
    if (selectedRoll === 'manual') {
      rollDice(rollCount, diceSide, updateRollValue);
      setDisabled(true);
      setTimeout(() => setDisabled(false), 4000);
      return;
    }

    if (isPaused && timeLeft === autoTime) {
      rollDice(rollCount, diceSide, updateRollValue);
    }
    togglePause();
  };

  const handleMenuItemClick = useCallback(
    (key: string | number): void => {
      if (key === 'restart') {
        updateRollValue(-1);
        return;
      }

      setSelectedRoll(String(key));

      if (key === 'custom') {
        setDialogOpen(true);
        return;
      }

      if (isNumeric(key)) {
        if (!isPaused) togglePause();
        const numericKey = Number(key);
        setAutoTime(numericKey);
        setTimeLeft(numericKey);
      }
    },
    [isPaused, setTimeLeft, togglePause, updateRollValue]
  );

  const handleDialogClose = (): void => {
    setDialogOpen(false);
  };

  const handleDialogSubmit = (
    time: number,
    settings: Partial<TimerSettings> = { isRange: false }
  ): void => {
    if (!isPaused) togglePause();
    setAutoTime(time);
    setTimeLeft(time);
    setTimerSettings({ ...timerSettings, ...settings });
    setSelectedRoll('custom');
    setDialogOpen(false);
  };

  useEffect(() => {
    if (isEndOfBoard) {
      togglePause();
    }
  }, [isEndOfBoard, togglePause]);

  useEffect(() => {
    if (isDisabled) {
      setRollText(t('wait'));
    } else if (selectedRoll === 'manual') {
      setRollText(t('roll'));
    } else if (isPaused) {
      setRollText(`${t('play')} (${timeLeft})`);
    } else if (timeLeft > 0) {
      setRollText(`${t('pause')} (${timeLeft})`);
    } else if (timeLeft === 0 && !isPaused && selectedRoll !== 'manual') {
      // Only roll and reset timer if we're not paused and not in manual mode
      rollDice(rollCount, diceSide, updateRollValue);

      let newTime: number;
      if (timerSettings.isRange) {
        const { min, max } = timerSettings;
        newTime = Math.floor(Math.random() * (max - min + 1)) + min;
      } else {
        newTime = autoTime;
      }

      setAutoTime(newTime);
      setTimeLeft(newTime);
      setRollText(`${t('pause')} (${newTime})`);
    }
  }, [
    isDisabled,
    selectedRoll,
    timeLeft,
    isPaused,
    autoTime,
    timerSettings,
    t,
    rollCount,
    diceSide,
    updateRollValue,
  ]);

  return (
    <>
      <ButtonGroup variant="contained" className="dice-roller">
        <Button aria-label={t('roll')} onClick={handleClick} disabled={isDisabled} size="large">
          <Casino sx={{ mr: 1 }} />
          {rollText}
        </Button>
        <RollOptionsMenu selectedRoll={selectedRoll} handleMenuItemClick={handleMenuItemClick} />
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
