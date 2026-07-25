/**
 * Types for sync operations and conflict resolution
 */

export interface SyncOptions {
  forceSync?: boolean;
}

export interface SyncResult {
  success: boolean;
  itemsProcessed?: number;
  conflicts?: string[];
  errors?: string[];
  /**
   * The merge altered local state (or local content the cloud lacks was found),
   * so the cycle owes the cloud one push. Entity merges never push themselves —
   * the orchestrator publishes once, after every merge has finished.
   */
  changed?: boolean;
}

export interface SyncConflictResolution {
  strategy: 'local' | 'remote' | 'merge';
  preserveLocal?: boolean;
}

export interface SyncOperationResult {
  success: boolean;
  itemsProcessed: number;
  conflicts: string[];
  errors: Error[];
}

export interface ConflictInfo {
  type: 'tiles' | 'groups' | 'settings';
  localCount: number;
  remoteCount: number;
  description: string;
}
