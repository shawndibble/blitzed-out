import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import db from '../store';
import {
  getSubscription,
  getSubscriptions,
  mergeRemoteSubscriptions,
  removeSubscription,
  upsertSubscription,
} from '../packSubscriptions';
import type { PackSubscription } from '@/types/contentPacks';

function sub(packId: string, packVersion: number, updatedAt?: number): PackSubscription {
  return {
    packId,
    packVersion,
    name: `Pack ${packId}`,
    authorName: 'tester',
    gameMode: 'online',
    locale: 'en',
    subscribedAt: 1,
    updatedAt: updatedAt ?? 1,
  };
}

beforeEach(async () => {
  await db.packSubscriptions.clear();
});
afterEach(async () => {
  await db.packSubscriptions.clear();
});

describe('packSubscriptions store', () => {
  it('upserts by packId (re-subscribe overwrites version)', async () => {
    await upsertSubscription(sub('p1', 1));
    await upsertSubscription(sub('p1', 2));
    const all = await getSubscriptions();
    expect(all).toHaveLength(1);
    expect((await getSubscription('p1'))?.packVersion).toBe(2);
  });

  it('removes a subscription', async () => {
    await upsertSubscription(sub('p1', 1));
    await removeSubscription('p1');
    expect(await getSubscription('p1')).toBeUndefined();
  });

  describe('mergeRemoteSubscriptions (last-writer-wins)', () => {
    it('applies a newer remote subscription', async () => {
      await upsertSubscription({ ...sub('p1', 1), updatedAt: 100 });
      const changed = await mergeRemoteSubscriptions([sub('p1', 2, 200)]);
      expect(changed).toBe(1);
      expect((await getSubscription('p1'))?.packVersion).toBe(2);
    });

    it('ignores an older remote subscription', async () => {
      await upsertSubscription({ ...sub('p1', 5), updatedAt: 500 });
      const changed = await mergeRemoteSubscriptions([sub('p1', 1, 100)]);
      expect(changed).toBe(0);
      expect((await getSubscription('p1'))?.packVersion).toBe(5);
    });

    it('adds previously-unseen remote subscriptions', async () => {
      const changed = await mergeRemoteSubscriptions([sub('p1', 1, 50), sub('p2', 1, 50)]);
      expect(changed).toBe(2);
      expect(await getSubscriptions()).toHaveLength(2);
    });
  });
});
