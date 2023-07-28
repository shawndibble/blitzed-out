import { useEffect, useState } from 'react';

export default function useCountdown(startSeconds) {
  const [timeLeft, setTimeLeft] = useState(startSeconds);

  useEffect(() => {
    if (timeLeft === 0) {
      setTimeLeft(null);
    }

    // exit early when we reach 0
    if (!timeLeft) return;

    // save intervalId to clear the interval when the
    // component re-renders
    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    // clear interval on re-render to avoid memory leaks
    // eslint-disable-next-line consistent-return
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  return { timeLeft };
}
