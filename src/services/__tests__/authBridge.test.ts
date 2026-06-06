import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@/types';
import { __resetForTesting, registerSyncProvider, requestSync } from '../authBridge';

const createUser = (isAnonymous = false): User =>
  ({
    isAnonymous,
  }) as User;

describe('authBridge', () => {
  beforeEach(() => {
    __resetForTesting();
  });

  it('does nothing without a registered provider', () => {
    expect(() => requestSync()).not.toThrow();
  });

  it('requests sync for registered non-anonymous users', () => {
    const syncData = vi.fn().mockResolvedValue(true);

    registerSyncProvider({ user: createUser(), syncData });
    requestSync();

    expect(syncData).toHaveBeenCalledTimes(1);
  });

  it('does not sync for anonymous or null users', () => {
    const anonymousSyncData = vi.fn().mockResolvedValue(true);
    const nullSyncData = vi.fn().mockResolvedValue(true);

    registerSyncProvider({ user: createUser(true), syncData: anonymousSyncData });
    requestSync();

    registerSyncProvider({ user: null, syncData: nullSyncData });
    requestSync();

    expect(anonymousSyncData).not.toHaveBeenCalled();
    expect(nullSyncData).not.toHaveBeenCalled();
  });

  it('unregisters the active provider with the cleanup function', () => {
    const syncData = vi.fn().mockResolvedValue(true);
    const cleanup = registerSyncProvider({ user: createUser(), syncData });

    cleanup();
    requestSync();

    expect(syncData).not.toHaveBeenCalled();
  });

  it('does not throw when syncData fails', () => {
    const syncData = vi.fn().mockRejectedValue(new Error('sync failed'));

    registerSyncProvider({ user: createUser(), syncData });

    expect(() => requestSync()).not.toThrow();
  });
});
