import { useEffect, useState } from 'react';

export default function useCountdown(startSeconds, startPaused = true) {
  const [timeLeft, setTimeLeft] = useState(startSeconds);
  const [isPaused, setPause] = useState(startPaused);

  const togglePause = () => setPause(!isPaused);

  useEffect(() => {
    if (timeLeft === -1) {
      setTimeLeft(0);
    }

    // exit early when we reach 0
    if (timeLeft < 0 || isPaused) return;

    // save intervalId to clear the interval when the
    // component re-renders
    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    // clear interval on re-render to avoid memory leaks
    // eslint-disable-next-line consistent-return
    return () => clearInterval(intervalId);
  }, [timeLeft, isPaused]);

  return {
    timeLeft, setTimeLeft, togglePause, isPaused,
  };
}
