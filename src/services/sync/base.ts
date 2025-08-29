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
   * Create success result
   */
  static createSuccessResult(itemsProcessed = 0): SyncResult {
    return {
      success: true,
      itemsProcessed,
    };
  }
}
