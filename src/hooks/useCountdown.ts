import { useEffect, useState, useCallback, useRef } from 'react';

interface CountdownResult {
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  togglePause: () => void;
  pause: () => void;
  restart: () => void;
  isPaused: boolean;
}

export default function useCountdown(
  startSeconds: number,
  startPaused: boolean = true,
  onComplete?: () => void,
  holdWhile?: () => boolean
): CountdownResult {
  const normalizedStartSeconds = startSeconds === -1 ? 0 : startSeconds;
  const [timeLeft, setTimeLeft] = useState<number>(normalizedStartSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(startPaused);
  const holdWhileRef = useRef(holdWhile);
  useEffect(() => {
    holdWhileRef.current = holdWhile;
  }, [holdWhile]);
  // Held in a ref so an unmemoized callback cannot re-run the effect below and
  // rebuild the interval mid-second, which would stretch the countdown.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  const completedRef = useRef(false);

  const togglePause = useCallback((): void => setIsPaused((prev) => !prev), []);
  const pause = useCallback((): void => setIsPaused(true), []);
  const restart = useCallback((): void => {
    completedRef.current = false;
    setTimeLeft(normalizedStartSeconds);
    setIsPaused(false);
  }, [normalizedStartSeconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      // Once per run: a second call would close something already closed.
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
      return;
    }

    completedRef.current = false;
    if (isPaused) return;

    const intervalId = setInterval(() => {
      // Hold (without pausing) while an external condition is active — e.g.
      // hands-free waits for the spoken action to finish before counting down.
      if (holdWhileRef.current?.()) return;
      setTimeLeft((currentTime) => {
        if (currentTime <= 1) {
          return 0;
        }
        return currentTime - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft, isPaused]);

  return {
    timeLeft,
    setTimeLeft,
    togglePause,
    pause,
    restart,
    isPaused,
  };
}
