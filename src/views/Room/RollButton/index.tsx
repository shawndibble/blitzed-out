import { Casino } from '@mui/icons-material';
import { Button, ButtonGroup } from '@mui/material';
import { useCallback, useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './styles.css';
import useCountdown from '@/hooks/useCountdown';
import RollOptionsMenu from '../RollOptionsMenu';
import CustomTimerDialog from '../CustomTimerDialog';
import OnboardingWrapper from './OnboardingWrapper';
import { analytics } from '@/services/analytics';

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

function RollButton({ setRollValue, dice, isEndOfBoard }: RollButtonProps): JSX.Element {
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

  const componentMountTime = useRef<number>(0);
  const interactionCount = useRef<number>(0);

  useEffect(() => {
    componentMountTime.current = Date.now();
  }, []);

  const [rollCount, diceSide] = dice.split('d');

  const handleClick = (): void => {
    // Track engagement
    interactionCount.current += 1;
    analytics.trackEngagement('roll_button_click', 0, interactionCount.current);

    if (selectedRoll === 'manual') {
      rollDice(rollCount, diceSide, setRollValue);
      setDisabled(true);
      setTimeout(() => setDisabled(false), 4000);
      return;
    }

    if (isPaused && timeLeft === autoTime) {
      rollDice(rollCount, diceSide, setRollValue);
    }
    togglePause();
  };

  const handleMenuItemClick = useCallback(
    (key: string | number): void => {
      if (key === 'restart') {
        setRollValue(-1);
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
    [isPaused, setTimeLeft, togglePause, setRollValue]
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
    let newRollText: string;
    let shouldRollDice = false;
    let newTime: number | null = null;

    if (isDisabled) {
      newRollText = t('wait');
    } else if (selectedRoll === 'manual') {
      newRollText = t('roll');
    } else if (isPaused) {
      newRollText = `${t('play')} (${timeLeft})`;
    } else if (timeLeft > 0) {
      newRollText = `${t('pause')} (${timeLeft})`;
    } else if (timeLeft === 0 && !isPaused && selectedRoll !== 'manual') {
      shouldRollDice = true;

      if (timerSettings.isRange) {
        const { min, max } = timerSettings;
        newTime = Math.floor(Math.random() * (max - min + 1)) + min;
      } else {
        newTime = autoTime;
      }

      newRollText = `${t('pause')} (${newTime})`;
    } else {
      return;
    }

    // Defer state updates and rollDice into a microtask to avoid performing React state updates
    // (or side effects) during the current render/event phase, which caused Sentry noise/duplicate
    // errors in previous implementations. This pattern mirrors deferral used elsewhere in the codebase.
    // WARNING: Removing queueMicrotask may reintroduce Sentry errors or render-timing issues.
    queueMicrotask(() => {
      if (shouldRollDice && newTime !== null) {
        rollDice(rollCount, diceSide, setRollValue);
        setAutoTime(newTime);
        setTimeLeft(newTime);
      }
      setRollText(newRollText);
    });
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
    setRollValue,
    setTimeLeft,
  ]);

  // Track engagement session on component unmount
  useEffect(() => {
    const start = componentMountTime.current;
    return () => {
      const duration = Date.now() - start;
      analytics.trackEngagement('roll_button_session', duration, interactionCount.current);
    };
  }, []);

  return (
    <>
      <OnboardingWrapper className="dice-roller">
        <ButtonGroup variant="contained">
          <Button aria-label={t('roll')} onClick={handleClick} disabled={isDisabled} size="large">
            <Casino sx={{ mr: 1 }} />
            {rollText}
          </Button>
          <RollOptionsMenu selectedRoll={selectedRoll} handleMenuItemClick={handleMenuItemClick} />
        </ButtonGroup>
      </OnboardingWrapper>
      <CustomTimerDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
      />
    </>
  );
}

export default RollButton;
