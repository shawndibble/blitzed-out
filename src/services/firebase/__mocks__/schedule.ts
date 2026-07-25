import { vi } from 'vitest';

export const getSchedule = vi.fn(() => vi.fn());
export const addSchedule = vi.fn().mockResolvedValue({ id: 'mock-schedule-id' });
export const updateSchedule = vi.fn().mockResolvedValue(undefined);
export const deleteSchedule = vi.fn().mockResolvedValue(undefined);
