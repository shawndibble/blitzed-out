import db from './store';
import type { PackSubscription } from '@/types/contentPacks';

const { packSubscriptions } = db;

// Keep the last-writer-wins timestamp fresh on local writes; sync merges pass an
// explicit `updatedAt` (the remote one) which must be preserved.
packSubscriptions.hook('creating', function (this: any, _primKey, obj: PackSubscription) {
  if (obj.updatedAt === undefined) obj.updatedAt = Date.now();
});
packSubscriptions.hook('updating', function (this: any, modifications: any) {
  if (modifications && !('updatedAt' in modifications)) {
    return { updatedAt: Date.now() };
  }
});

/** All current subscriptions. */
export async function getSubscriptions(): Promise<PackSubscription[]> {
  return await packSubscriptions.toArray();
}

/** Look up a single subscription by pack id. */
export async function getSubscription(packId: string): Promise<PackSubscription | undefined> {
  return await packSubscriptions.where('packId').equals(packId).first();
}

/**
 * Record (or refresh) a subscription after importing a pack. Keyed by packId —
 * re-subscribing/updating overwrites the existing row's version + metadata.
 */
export async function upsertSubscription(
  sub: Omit<PackSubscription, 'id' | 'updatedAt'> & { updatedAt?: number }
): Promise<void> {
  const existing = await getSubscription(sub.packId);
  if (existing?.id !== undefined) {
    await packSubscriptions.update(existing.id, { ...sub, updatedAt: sub.updatedAt ?? Date.now() });
  } else {
    await packSubscriptions.add({
      ...sub,
      updatedAt: sub.updatedAt ?? Date.now(),
    } as PackSubscription);
  }
}

/** Remove a subscription locally. */
export async function removeSubscription(packId: string): Promise<void> {
  const existing = await getSubscription(packId);
  if (existing?.id !== undefined) await packSubscriptions.delete(existing.id);
}

/**
 * Merge remote subscription records using per-record last-writer-wins (keyed by
 * packId). Additive — like the rest of the sync engine, deletions don't
 * propagate without a full replace. Returns the number of records changed.
 */
export async function mergeRemoteSubscriptions(remote: PackSubscription[]): Promise<number> {
  let changed = 0;
  for (const r of remote) {
    if (!r || typeof r.packId !== 'string') continue;
    const local = await getSubscription(r.packId);
    const remoteTs = typeof r.updatedAt === 'number' ? r.updatedAt : 0;
    const localTs = typeof local?.updatedAt === 'number' ? local.updatedAt : -1;
    if (remoteTs > localTs) {
      await upsertSubscription({
        packId: r.packId,
        packVersion: r.packVersion,
        name: r.name,
        authorName: r.authorName,
        gameMode: r.gameMode,
        locale: r.locale,
        subscribedAt: r.subscribedAt,
        updatedAt: remoteTs,
      });
      changed++;
    }
  }
  return changed;
}
