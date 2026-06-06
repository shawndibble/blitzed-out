/**
 * Base utilities for sync operations
 */
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import type { SyncResult } from '@/types/sync';

export const SYNC_DELAY_MS = 50;

export class SyncBase {
  /**
   * Get authenticated user or throw error
   */
  static getAuthenticatedUser() {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('No user logged in');
    }

    return user;
  }

  /**
   * Get user document from Firebase
   */
  static async getUserDocument(userId: string) {
    const userDocRef = doc(db, 'user-data', userId);
    return await getDoc(userDocRef);
  }

  /**
   * Add sync delay between operations
   */
  static async addSyncDelay() {
    await new Promise((resolve) => setTimeout(resolve, SYNC_DELAY_MS));
  }

  /**
   * Safely remove ID field from object to avoid constraint errors
   */
  static removeId<T extends { id?: any }>(obj: T): Omit<T, 'id'> {
    const { id, ...objWithoutId } = obj;
    void id; // Explicitly ignore the id
    return objWithoutId;
  }

  /**
   * Handle sync operation errors consistently
   */
  static handleSyncError(operation: string, error: unknown): SyncResult {
    console.error(`Error in ${operation}:`, error);
    return {
      success: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }

  /**
   * Last-writer-wins decision for a single entity.
   *
   * Strict `>` so that once two devices converge to the same timestamp neither
   * keeps re-applying (which would loop the real-time listener). Fallbacks when a
   * timestamp is absent (data written before this feature shipped):
   * - local stamped, remote not  → keep local (remote is stale, pre-feature)
   * - remote stamped, local not  → apply remote
   * - neither stamped            → apply remote (preserves legacy behavior)
   */
  static remoteWins(localTs?: number, remoteTs?: number): boolean {
    const l = typeof localTs === 'number' ? localTs : null;
    const r = typeof remoteTs === 'number' ? remoteTs : null;
    if (l !== null && r !== null) return r > l;
    if (l !== null) return false;
    return true;
  }

  /**
   * Create success result
   */
  static createSuccessResult(itemsProcessed = 0): SyncResult {
    return {
      success: true,
      itemsProcessed,
    };
  }
}
