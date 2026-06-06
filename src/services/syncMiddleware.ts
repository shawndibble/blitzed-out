import { Middleware, DBCore, DBCoreTable, DBCoreMutateRequest } from 'dexie';
import { requestSync } from './authBridge';

interface SyncMiddlewareOptions {
  tables: string[];
}

/**
 * Apply-phase suppression. While the sync engine is writing remote changes into
 * Dexie, those writes must NOT schedule a push back to Firebase — otherwise the
 * real-time listener would echo our own apply into an infinite push↔pull loop.
 * The depth counter is checked synchronously at write-time inside `mutate`.
 */
let applyDepth = 0;

export function beginSyncApply(): void {
  applyDepth += 1;
}

export function endSyncApply(): void {
  applyDepth = Math.max(0, applyDepth - 1);
}

export function isApplyingRemoteSync(): boolean {
  return applyDepth > 0;
}

interface TimeoutMap {
  [key: string]: ReturnType<typeof setTimeout>;
}

interface SyncDebounce {
  timeouts: TimeoutMap;
  queue: Set<string>;
  scheduleSync(tableName: string): void;
  processSyncQueue(): void;
}

interface DexieMiddleware extends Middleware<DBCore> {
  stack: 'dbcore';
  name: string;
}

/**
 * Creates a Dexie middleware that syncs data to Firebase after database modifications
 * @param options - Configuration options
 * @returns Dexie middleware function
 */
export function createSyncMiddleware(
  options: SyncMiddlewareOptions = { tables: ['customTiles', 'gameBoard'] }
): DexieMiddleware {
  const { tables } = options;
  const tableSet = new Set(tables);

  // Debounce mechanism
  const syncDebounce: SyncDebounce = {
    timeouts: {},
    queue: new Set<string>(),

    // Schedule a sync for a specific table
    scheduleSync(tableName: string): void {
      // Clear any existing timeout for this table
      if (this.timeouts[tableName]) {
        clearTimeout(this.timeouts[tableName]);
      }

      // Add to queue
      this.queue.add(tableName);

      // Set a new timeout
      this.timeouts[tableName] = setTimeout(() => {
        this.processSyncQueue();
      }, 2000); // 2 second debounce
    },

    // Process all tables in the queue
    processSyncQueue(): void {
      if (this.queue.size === 0) return;

      requestSync();

      // Clear the queue and timeouts
      this.queue.clear();
      Object.keys(this.timeouts).forEach((key) => {
        clearTimeout(this.timeouts[key]);
        delete this.timeouts[key];
      });
    },
  };

  return {
    stack: 'dbcore',
    name: 'syncMiddleware',
    create(downlevelDatabase: DBCore): DBCore {
      return {
        ...downlevelDatabase,
        table(tableName: string): DBCoreTable {
          const downlevelTable = downlevelDatabase.table(tableName);

          // Only apply middleware to specified tables
          if (!tableSet.has(tableName)) {
            return downlevelTable;
          }

          return {
            ...downlevelTable,
            mutate: async (req: DBCoreMutateRequest): Promise<any> => {
              // First, perform the actual database operation
              const result = await downlevelTable.mutate(req);

              // After successful operation, trigger sync if it's a write operation.
              // Skip writes made by the sync engine itself while applying remote
              // changes (checked synchronously to avoid queueing an echo push).
              if (
                !isApplyingRemoteSync() &&
                ['put', 'add', 'delete', 'deleteRange', 'update'].includes(req.type)
              ) {
                // Schedule a sync for this table with debouncing
                syncDebounce.scheduleSync(tableName);
              }

              return result;
            },
          };
        },
      };
    },
  };
}
