import { vi } from 'vitest';

export const getOrCreateBoard = vi.fn().mockResolvedValue({ id: 'mock-board-id' });
export const getBoard = vi.fn().mockResolvedValue(undefined);
