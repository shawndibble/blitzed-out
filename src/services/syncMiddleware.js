/**
 * Creates a Dexie middleware that syncs data to Firebase after database modifications
 * @param {Object} options - Configuration options
 * @param {Array<string>} options.tables - Tables to watch for changes
 * @returns {Function} Dexie middleware function
 */
export function createSyncMiddleware(options = { tables: ['customTiles', 'gameBoard'] }) {
  const { tables } = options;
  const tableSet = new Set(tables);

  // Debounce mechanism
  const syncDebounce = {
    timeouts: {},
    queue: new Set(),

    // Schedule a sync for a specific table
    scheduleSync(tableName) {
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
    processSyncQueue() {
      if (this.queue.size === 0) return;

      // Only sync if we have an authenticated non-anonymous user
      if (window.authContext?.user && !window.authContext.user.isAnonymous) {
        window.authContext.syncData();
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
    create(downlevelDatabase) {
      return {
        ...downlevelDatabase,
        table(tableName) {
          const downlevelTable = downlevelDatabase.table(tableName);

          // Only apply middleware to specified tables
          if (!tableSet.has(tableName)) {
            return downlevelTable;
          }

          return {
            ...downlevelTable,
            mutate: async (req) => {
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
