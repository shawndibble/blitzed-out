import type { CallableRequest } from 'firebase-functions/v2/https';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * These cover the one thing the Gen 1 -> Gen 2 migration actually changed about
 * behaviour: handlers now read a single `request` (`request.auth`, `request.data`)
 * instead of `(data, context)`, and Firestore triggers read `event.data`, which v2
 * types as optional. A missed rename still compiles — `request.auth` on the old
 * shape is simply `undefined` — so it would silently drop every auth check.
 *
 * The emulator cannot cover this: `initializeApp({ credential: applicationDefault() })`
 * fails there without real credentials, on v1 and v2 alike. `.run()` is the SDK's
 * documented unit-test hook and needs no credentials, as long as the assertion sits
 * on a path that returns before the first admin-SDK call.
 */

vi.mock('firebase-admin/app', () => ({
  applicationDefault: () => ({}),
  getApps: () => [{}],
  initializeApp: vi.fn(),
}));
vi.mock('firebase-admin/database', () => ({
  getDatabase: () => {
    throw new Error('getDatabase should not be reached on a rejected request');
  },
  ServerValue: { TIMESTAMP: 0 },
}));
vi.mock('firebase-admin/auth', () => ({
  getAuth: () => {
    throw new Error('getAuth should not be reached on a rejected request');
  },
}));
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => {
    throw new Error('getFirestore should not be reached');
  },
  FieldValue: { serverTimestamp: () => 0 },
  Timestamp: { fromMillis: (ms: number) => ms },
}));

const asRequest = <T>(request: Partial<CallableRequest<T>>) => request as CallableRequest<T>;

describe('getTurnCredentials (v2 callable)', () => {
  it('rejects an unauthenticated caller', async () => {
    const { getTurnCredentials } = await import('../turnCredentials');

    await expect(
      getTurnCredentials.run(asRequest({ data: { roomId: 'PUBLIC' } }))
    ).rejects.toMatchObject({ code: 'unauthenticated' });
  });

  it('rejects a malformed roomId before touching the database', async () => {
    const { getTurnCredentials } = await import('../turnCredentials');

    await expect(
      getTurnCredentials.run(
        asRequest({
          data: { roomId: 'bad room!!' },
          auth: { uid: 'u1', token: {} as never, rawToken: '' },
        })
      )
    ).rejects.toMatchObject({ code: 'invalid-argument' });
  });

  it('rejects a missing roomId', async () => {
    const { getTurnCredentials } = await import('../turnCredentials');

    await expect(
      getTurnCredentials.run(
        asRequest({ data: {}, auth: { uid: 'u1', token: {} as never, rawToken: '' } })
      )
    ).rejects.toMatchObject({ code: 'invalid-argument' });
  });
});

describe('manual cleanup callables (v2)', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.FUNCTIONS_EMULATOR;
    process.env.NODE_ENV = 'production';
  });

  it('manualCleanupStaleUsers denies a non-admin caller', async () => {
    const { manualCleanupStaleUsers } = await import('../index');

    await expect(
      manualCleanupStaleUsers.run(asRequest({ data: { minutes: 5 } }))
    ).rejects.toMatchObject({ code: 'permission-denied' });
  });

  it('manualCleanupStaleUsers denies an authenticated caller without the admin claim', async () => {
    const { manualCleanupStaleUsers } = await import('../index');

    await expect(
      manualCleanupStaleUsers.run(
        asRequest({ data: {}, auth: { uid: 'u1', token: { admin: false } as never, rawToken: '' } })
      )
    ).rejects.toMatchObject({ code: 'permission-denied' });
  });

  it('manualCleanupAnonymousAccounts denies a non-admin caller in production', async () => {
    const { manualCleanupAnonymousAccounts } = await import('../index');

    await expect(manualCleanupAnonymousAccounts.run(asRequest({ data: {} }))).rejects.toMatchObject(
      { code: 'permission-denied' }
    );
  });
});

describe('onPackReported (v2 Firestore trigger)', () => {
  it('returns quietly when the document is gone on delivery', async () => {
    const { onPackReported } = await import('../reportNotification');

    await expect(
      onPackReported.run({ data: undefined, params: { reportId: 'r1' } } as never)
    ).resolves.toBeUndefined();
  });
});
