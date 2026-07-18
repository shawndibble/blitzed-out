import { useEffect, useState, useCallback, useRef } from 'react';

interface CountdownResult {
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  togglePause: () => void;
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

  const togglePause = useCallback((): void => setIsPaused((prev) => !prev), []);

  useEffect(() => {
    if (timeLeft === 0 && onComplete) {
      onComplete();
      return;
    }

    if (timeLeft <= 0 || isPaused) return;

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
  }, [timeLeft, isPaused, onComplete]);

  return {
    timeLeft,
    setTimeLeft,
    togglePause,
    isPaused,
  };
}
