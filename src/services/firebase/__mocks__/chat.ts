import { vi } from 'vitest';

export const getMessages = vi.fn(() => vi.fn());
export const sendMessage = vi.fn().mockResolvedValue(undefined);
export const deleteMessage = vi.fn().mockResolvedValue(undefined);
