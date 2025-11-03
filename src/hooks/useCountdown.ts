import { useEffect, useState, useCallback } from 'react';

interface CountdownResult {
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  togglePause: () => void;
  isPaused: boolean;
}

export default function useCountdown(
  startSeconds: number,
  startPaused: boolean = true,
  onComplete?: () => void
): CountdownResult {
  const normalizedStartSeconds = startSeconds === -1 ? 0 : startSeconds;
  const [timeLeft, setTimeLeft] = useState<number>(normalizedStartSeconds);
  const [isPaused, setPause] = useState<boolean>(startPaused);

  const togglePause = useCallback((): void => setPause((prev) => !prev), []);

  useEffect(() => {
    if (timeLeft === 0 && onComplete) {
      onComplete();
      return;
    }

    if (timeLeft <= 0 || isPaused) return;

    const intervalId = setInterval(() => {
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
