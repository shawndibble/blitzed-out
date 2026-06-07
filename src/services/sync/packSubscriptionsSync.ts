/**
 * Pack subscriptions synchronization. Subscriptions sync per-record with
 * last-writer-wins (keyed by packId) so a pack imported on one device surfaces
 * its update/unsubscribe controls on the others. Additive like the rest of the
 * engine — deletions propagate only via a full replace.
 */
import { SyncBase } from './base';
import { mergeRemoteSubscriptions } from '@/stores/packSubscriptions';
import { syncPackSubscriptionsToFirebase } from '../syncService';
import type { PackSubscription } from '@/types/contentPacks';
import type { SyncResult } from '@/types/sync';

export class PackSubscriptionsSync extends SyncBase {
  static async syncFromFirebase(remote: PackSubscription[]): Promise<SyncResult> {
    try {
      const changed = await mergeRemoteSubscriptions(Array.isArray(remote) ? remote : []);
      if (changed > 0) {
        await syncPackSubscriptionsToFirebase();
      }
      return this.createSuccessResult(changed);
    } catch (error) {
      return this.handleSyncError('pack subscriptions sync', error);
    }
  }
}
