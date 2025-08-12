/**
 * Database cursor error recovery utility
 *
 * Provides shared logic for handling cursor-related database errors
 * by reopening the database and retrying the operation once.
 */

interface DatabaseLike {
  isOpen?(): boolean;
  open?(): any;
  close?(): any;
}

/**
 * Retries a database operation once if it fails with a cursor-related error.
 *
 * @param db - Database instance with isOpen, open, and close methods
 * @param operation - Async operation to execute and potentially retry
 * @param logger - Optional custom logger function (defaults to console.error)
 * @returns Promise that resolves to the operation result
 * @throws Re-throws the error if retry fails or if it's not a cursor error
 */
export async function retryOnCursorError<T>(
  db: DatabaseLike,
  operation: () => Promise<T>,
  logger?: (message: string, error?: Error) => void
): Promise<T> {
  const log =
    logger ||
    ((message: string, error?: Error) => {
      console.error(message, error);
    });

  try {
    // Check if database is ready (skip in test environment)
    if (typeof db.isOpen === 'function' && !db.isOpen()) {
      await db.open?.();
    }

    return await operation();
  } catch (error) {
    const errorInstance = error instanceof Error ? error : new Error(String(error));
    log('Database operation failed:', errorInstance);

    // If it's a cursor error, try to recover by reopening the database
    if (errorInstance.message.includes('cursor')) {
      try {
        if (typeof db.close === 'function' && typeof db.open === 'function') {
          await db.close();
          await db.open();
          return await operation();
        }
      } catch (retryError) {
        const retryErrorInstance =
          retryError instanceof Error ? retryError : new Error(String(retryError));
        log('Error retrying operation after cursor error:', retryErrorInstance);
        throw retryErrorInstance;
      }
    }

    throw errorInstance;
  }
}
