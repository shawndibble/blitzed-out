import { Middleware, DBCore, DBCoreTable, DBCoreMutateRequest } from 'dexie';
import { WindowWithAuth } from '../types/app';

interface SyncMiddlewareOptions {
  tables: string[];
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

      // Only sync if we have an authenticated non-anonymous user
      const windowWithAuth = window as WindowWithAuth;
      if (windowWithAuth.authContext?.user && !windowWithAuth.authContext.user.isAnonymous) {
        windowWithAuth.authContext.syncData();
      }

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

              // After successful operation, trigger sync if it's a write operation
              if (['put', 'add', 'delete', 'deleteRange', 'update'].includes(req.type)) {
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
