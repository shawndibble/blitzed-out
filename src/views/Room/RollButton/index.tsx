import { Casino, Pause, PlayArrow } from '@mui/icons-material';
import { Button, ButtonGroup, Tooltip } from '@mui/material';
import useBreakpoint from '@/hooks/useBreakpoint';
import { forwardRef, useCallback, useEffect, useState, useRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import './styles.css';
import useCountdown from '@/hooks/useCountdown';
import useWakeLock from '@/hooks/useWakeLock';
import RollOptionsMenu from '../RollOptionsMenu';
import HandsFreeDialog from '@/views/Room/HandsFreeDialog';
import AutoRollDialog from '@/views/Room/AutoRollDialog';
import OnboardingWrapper from './OnboardingWrapper';
import { analytics } from '@/services/analytics';
import DiceRoller from '@/components/DiceRoller';
import { isHandsFreeAvailable, resolveHandsFreeRange } from '@/helpers/handsFree';
import { useSettings } from '@/stores/settingsStore';
import { useDiceAnimationStore } from '@/stores/diceAnimationStore';
import { vibrate } from '@/utils/haptics';
import { useAuth } from '@/hooks/useAuth';
import { recordDiceRoll } from '@/services/playerStatsService';

interface RollButtonProps {
  setRollValue: (value: number) => void;
  dice: string;
  isEndOfBoard: boolean;
}

export interface RollButtonHandle {
  triggerRoll: () => void;
}

interface TimerSettings {
  isRange: boolean;
  min: number;
  max: number;
}

interface PendingRoll {
  notation: string;
  values: number | number[];
  total: number;
}

function isNumeric(value: string | number): boolean {
  return /^-?\d+$/.test(String(value));
}

function calculateDiceRoll(rollCount: string, diceSide: string): PendingRoll {
  const count = Number(rollCount);
  const sides = Number(diceSide);
  const values: number[] = [];

  for (let i = 0; i < count; i += 1) {
    values.push(Math.floor(Math.random() * sides) + 1);
  }

  const total = values.reduce((sum, val) => sum + val, 0);
  const notation = `${rollCount}d${diceSide}`;

  return {
    notation,
    values: count === 1 ? values[0] : values,
    total,
  };
}

const RollButton = forwardRef<RollButtonHandle, RollButtonProps>(function RollButton(
  { setRollValue, dice, isEndOfBoard },
  ref
) {
  const { t } = useTranslation();
  const [settings, updateSettings] = useSettings();
  const isMobile = useBreakpoint();
  const { user } = useAuth();
  const setAnimationSoundPlayed = useDiceAnimationStore((state) => state.setAnimationSoundPlayed);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);
  const [selectedRoll, setSelectedRoll] = useState<string>('manual');
  const [autoTime, setAutoTime] = useState<number>(0);
  const [rollText, setRollText] = useState<string>(t('roll'));
  const handsFreeActive = Boolean(settings.handsFree) && isHandsFreeAvailable(settings.gameMode);
  // Hands-free waits for the spoken action to finish before the next countdown ticks.
  const { timeLeft, setTimeLeft, togglePause, isPaused } = useCountdown(
    autoTime,
    true,
    undefined,
    useCallback(
      () => handsFreeActive && Boolean(window.speechSynthesis?.speaking),
      [handsFreeActive]
    )
  );
  const [isHandsFreeDialogOpen, setIsHandsFreeDialogOpen] = useState<boolean>(false);
  const [isAutoRollDialogOpen, setIsAutoRollDialogOpen] = useState<boolean>(false);
  const [timerSettings, setTimerSettings] = useState<TimerSettings>({
    isRange: false,
    min: 30,
    max: 120,
  });
  const [pendingRoll, setPendingRoll] = useState<PendingRoll | null>(null);

  // The screen must not sleep while hands-free is driving the game.
  useWakeLock(handsFreeActive && !isPaused);

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const selectedRollRef = useRef(selectedRoll);
  selectedRollRef.current = selectedRoll;

  // Sync the transport with the persisted hands-free settings.
  useEffect(() => {
    if (handsFreeActive) {
      const range = resolveHandsFreeRange(settings.handsFreePreset);
      const initial = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
      setSelectedRoll('handsFree');
      setTimerSettings({ isRange: true, min: range.min, max: range.max });
      setAutoTime(initial);
      setTimeLeft(initial);
      if (!isPausedRef.current) togglePause();
    } else if (selectedRollRef.current === 'handsFree') {
      if (!isPausedRef.current) togglePause();
      setSelectedRoll('manual');
    }
  }, [handsFreeActive, settings.handsFreePreset, setTimeLeft, togglePause]);

  const componentMountTimeRef = useRef<number>(0);
  const interactionCountRef = useRef<number>(0);

  useEffect(() => {
    componentMountTimeRef.current = Date.now();
  }, []);

  const [rollCount, diceSide] = dice.split('d');

  const triggerDiceAnimation = useCallback((): void => {
    const roll = calculateDiceRoll(rollCount, diceSide);

    // Record dice roll statistics. Serialize the writes so the lazy row-creation in
    // getOrCreateStats can't race itself and produce duplicate stat rows on first roll.
    const ownerId = user?.uid || 'anonymous';
    const rolledValues = Array.isArray(roll.values) ? roll.values : [roll.values];
    void (async () => {
      for (const value of rolledValues) {
        await recordDiceRoll(ownerId, value);
      }
    })();

    // If dice animation is disabled, immediately set the roll value
    if (settings.showDiceAnimation === false) {
      setRollValue(roll.total);
      return;
    }

    setPendingRoll(roll);
  }, [rollCount, diceSide, settings.showDiceAnimation, setRollValue, user?.uid]);

  const handleDiceAnimationComplete = useCallback(
    (value: number, playedSound: boolean): void => {
      if (playedSound) {
        setAnimationSoundPlayed();
      }
      setRollValue(value);
    },
    [setRollValue, setAnimationSoundPlayed]
  );

  const handleDiceAnimationFinished = useCallback((): void => {
    setPendingRoll(null);
  }, []);

  const handleClick = useCallback((): void => {
    // Don't trigger if already disabled (prevents rapid clicks)
    if (isDisabled) return;

    // Track engagement
    interactionCountRef.current += 1;
    analytics.trackEngagement('roll_button_click', 0, interactionCountRef.current);

    if (settings.hapticFeedback) {
      vibrate('short');
    }

    if (selectedRoll === 'manual') {
      triggerDiceAnimation();
      setIsDisabled(true);
      setTimeout(() => setIsDisabled(false), 4000);
      return;
    }

    if (isPaused && timeLeft === autoTime) {
      triggerDiceAnimation();
    }
    togglePause();
  }, [
    isDisabled,
    settings.hapticFeedback,
    selectedRoll,
    triggerDiceAnimation,
    isPaused,
    timeLeft,
    autoTime,
    togglePause,
  ]);

  // Expose triggerRoll for keyboard shortcuts
  useImperativeHandle(
    ref,
    () => ({
      triggerRoll: handleClick,
    }),
    [handleClick]
  );

  const handleMenuItemClick = useCallback(
    (key: string | number): void => {
      if (key === 'restart') {
        setRollValue(-1);
        return;
      }

      if (key === 'handsFree') {
        setIsHandsFreeDialogOpen(true);
        return;
      }

      if (key === 'autoRoll') {
        setIsAutoRollDialogOpen(true);
        return;
      }

      // Picking any manual/timer option is an explicit exit from hands-free.
      if (settings.handsFree) {
        updateSettings({ handsFree: false });
      }

      setSelectedRoll(String(key));

      if (isNumeric(key)) {
        if (!isPaused) togglePause();
        const numericKey = Number(key);
        setAutoTime(numericKey);
        setTimeLeft(numericKey);
      }
    },
    [isPaused, setTimeLeft, togglePause, setRollValue, settings.handsFree, updateSettings]
  );

  const handleAutoRollCustom = (time: number, custom: Partial<TimerSettings>): void => {
    if (settings.handsFree) {
      updateSettings({ handsFree: false });
    }
    if (!isPaused) togglePause();
    setAutoTime(time);
    setTimeLeft(time);
    setTimerSettings({ ...timerSettings, ...custom });
    setSelectedRoll('custom');
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

    // Defer state updates and dice animation into a microtask to avoid performing React state updates
    // (or side effects) during the current render/event phase, which caused Sentry noise/duplicate
    // errors in previous implementations. This pattern mirrors deferral used elsewhere in the codebase.
    // WARNING: Removing queueMicrotask may reintroduce Sentry errors or render-timing issues.
    queueMicrotask(() => {
      if (shouldRollDice && newTime !== null) {
        triggerDiceAnimation();
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
    triggerDiceAnimation,
    setTimeLeft,
  ]);

  // Track engagement session on component unmount
  useEffect(() => {
    const start = componentMountTimeRef.current;
    return () => {
      const duration = Date.now() - start;
      analytics.trackEngagement('roll_button_session', duration, interactionCountRef.current);
    };
  }, []);

  return (
    <>
      <OnboardingWrapper className="dice-roller">
        <ButtonGroup variant="contained">
          <Tooltip
            title={t('pressSpacebarToRoll')}
            placement="top"
            disableHoverListener={isMobile}
            disableFocusListener={isMobile}
            disableTouchListener
          >
            <Button
              aria-label={t('roll')}
              aria-keyshortcuts="Space"
              onClick={handleClick}
              disabled={isDisabled}
              size="large"
            >
              {handsFreeActive ? (
                isPaused ? (
                  <PlayArrow sx={{ mr: 1 }} />
                ) : (
                  <Pause sx={{ mr: 1 }} />
                )
              ) : (
                <Casino sx={{ mr: 1 }} />
              )}
              {rollText}
            </Button>
          </Tooltip>
          <RollOptionsMenu
            selectedRoll={selectedRoll}
            handleMenuItemClick={handleMenuItemClick}
            showHandsFree={isHandsFreeAvailable(settings.gameMode)}
          />
        </ButtonGroup>
      </OnboardingWrapper>
      <HandsFreeDialog
        open={isHandsFreeDialogOpen}
        onClose={() => setIsHandsFreeDialogOpen(false)}
      />
      <AutoRollDialog
        open={isAutoRollDialogOpen}
        onClose={() => setIsAutoRollDialogOpen(false)}
        onSelectFixed={(seconds) => handleMenuItemClick(String(seconds))}
        onSelectCustom={handleAutoRollCustom}
        selected={isNumeric(selectedRoll) || selectedRoll === 'custom' ? selectedRoll : undefined}
      />
      {pendingRoll && (
        <DiceRoller
          diceNotation={pendingRoll.notation}
          targetValue={pendingRoll.values}
          onComplete={handleDiceAnimationComplete}
          onFinished={handleDiceAnimationFinished}
          soundEnabled={settings.mySound}
        />
      )}
    </>
  );
});

export default RollButton;
