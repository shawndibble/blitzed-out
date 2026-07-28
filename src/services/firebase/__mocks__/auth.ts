/**
 * Manual mock for the auth concern, used by `vi.mock('@/services/firebase/auth')`.
 * Split out of the old monolithic `src/__mocks__/firebase.ts`, which also stubbed
 * chat, schedule and syncService — one mock serving several modules.
 */
import { vi } from 'vitest';

export const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  isAnonymous: false,
};

export const mockAnonymousUser = {
  uid: 'anon-user-id',
  email: null,
  displayName: 'Anonymous',
  isAnonymous: true,
};

export const loginAnonymously = vi.fn().mockResolvedValue(mockAnonymousUser);
export const loginWithEmail = vi.fn().mockResolvedValue(mockUser);
export const loginWithGoogle = vi.fn().mockResolvedValue(mockUser);
export const registerWithEmail = vi.fn().mockResolvedValue(mockUser);
export const updateDisplayName = vi.fn().mockResolvedValue(mockUser);
export const resetPassword = vi.fn().mockResolvedValue(undefined);
export const convertAnonymousAccount = vi.fn().mockResolvedValue(mockUser);
export const linkGoogleAccount = vi.fn().mockResolvedValue(mockUser);
export const logout = vi.fn().mockResolvedValue(undefined);
export const wipeAllAppData = vi.fn().mockResolvedValue(undefined);
