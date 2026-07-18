import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import useCountdown from '@/hooks/useCountdown';

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts down once unpaused', () => {
    const { result } = renderHook(() => useCountdown(5));

    act(() => result.current.togglePause());
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.timeLeft).toBe(2);
  });

  it('does not tick while paused', () => {
    const { result } = renderHook(() => useCountdown(5));

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.timeLeft).toBe(5);
  });

  it('holds the countdown while holdWhile returns true', () => {
    let holding = true;
    const { result } = renderHook(() => useCountdown(5, true, undefined, () => holding));

    act(() => result.current.togglePause());
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.timeLeft).toBe(5);

    holding = false;
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.timeLeft).toBe(3);
  });

  it('reaches zero and stops', () => {
    const { result } = renderHook(() => useCountdown(2));

    act(() => result.current.togglePause());
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.timeLeft).toBe(0);
  });
});
