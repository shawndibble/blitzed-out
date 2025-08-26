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

export interface IntelligentSyncResult {
  success: boolean;
  conflicts: string[];
}
