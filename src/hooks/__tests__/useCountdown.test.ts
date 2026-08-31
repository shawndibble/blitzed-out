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

  it('fires onComplete once, even when the callback identity changes', () => {
    const onComplete = vi.fn();
    const { result, rerender } = renderHook(() => useCountdown(2, false, () => onComplete()));

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    rerender();
    rerender();

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(result.current.timeLeft).toBe(0);
  });

  it('runs again after restart', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCountdown(2, false, onComplete));

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    act(() => result.current.restart());

    expect(result.current.timeLeft).toBe(2);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it('pause is idempotent where togglePause is not', () => {
    const { result } = renderHook(() => useCountdown(5, false));

    act(() => result.current.pause());
    act(() => result.current.pause());
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.timeLeft).toBe(5);
  });
});
