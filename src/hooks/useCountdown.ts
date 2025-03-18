import { useEffect, useState, useCallback } from 'react';

interface CountdownResult {
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  togglePause: () => void;
  isPaused: boolean;
}

export default function useCountdown(
  startSeconds: number,
  startPaused: boolean = true
): CountdownResult {
  const [timeLeft, setTimeLeft] = useState<number>(startSeconds);
  const [isPaused, setPause] = useState<boolean>(startPaused);

  const togglePause = useCallback((): void => setPause((prev) => !prev), []);

  useEffect(() => {
    if (timeLeft === -1) {
      setTimeLeft(0);
    }

    // exit early when we reach 0
    if (timeLeft <= 0 || isPaused) return;

    // save intervalId to clear the interval when the
    // component re-renders
    const intervalId = setInterval(() => {
      setTimeLeft((currentTime) => currentTime - 1);
    }, 1000);

    // clear interval on re-render to avoid memory leaks
    return () => clearInterval(intervalId);
  }, [timeLeft, isPaused]);

  return {
    timeLeft,
    setTimeLeft,
    togglePause,
    isPaused,
  };
}
