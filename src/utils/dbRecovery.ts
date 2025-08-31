/**
 * Database error recovery utility
 *
 * Provides shared logic for handling database errors by implementing
 * recovery strategies for different error types, particularly Safari
 * IndexedDB issues and cursor-related errors.
 */

// Safari IndexedDB stabilization delays (in milliseconds)
// Safari requires time for IndexedDB to stabilize after connection loss
const SAFARI_IDB_STABILIZE_DELAY_MS = 100;
// Additional delay after reopening to ensure connection is stable before retry
const SAFARI_IDB_POST_OPEN_DELAY_MS = 50;

interface DatabaseLike {
  isOpen?(): boolean;
  open?(): void | Promise<void>;
  close?(): void | Promise<void>;
}

/**
 * Recovery strategy interface for different error types
 */
interface RecoveryStrategy<T> {
  canHandle(error: Error): boolean;
  recover(
    db: DatabaseLike,
    operation: () => Promise<T>,
    logger: (message: string, error?: Error) => void
  ): Promise<T>;
}

/**
 * Detects if the current browser is Safari (desktop or mobile)
 */
function isSafari(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  const userAgent = navigator.userAgent;
  return userAgent.includes('Safari') && !userAgent.includes('Chrome');
}

/**
 * Recovery strategy for cursor-related errors
 */
class CursorErrorStrategy implements RecoveryStrategy<any> {
  canHandle(error: Error): boolean {
    return error.message.toLowerCase().includes('cursor');
  }

  async recover<T>(
    db: DatabaseLike,
    operation: () => Promise<T>,
    logger: (message: string, error?: Error) => void
  ): Promise<T> {
    logger('Attempting database recovery for cursor error');

    if (typeof db.close === 'function' && typeof db.open === 'function') {
      await db.close();
      await db.open();
      logger('Database reopened successfully, retrying operation');
      return await operation();
    } else {
      logger('Database does not support close/open operations');
      throw new Error('Database recovery not supported');
    }
  }
}

/**
 * Recovery strategy for Safari IndexedDB connection issues
 */
class SafariConnectionStrategy implements RecoveryStrategy<any> {
  canHandle(error: Error): boolean {
    if (!isSafari()) {
      return false;
    }

    const message = error.message.toLowerCase();
    return (
      message.includes('connection to indexed database server lost') ||
      message.includes('error looking up record in object store by key range') ||
      message.includes('indexeddb connection') ||
      message.includes('database connection')
    );
  }

  async recover<T>(
    db: DatabaseLike,
    operation: () => Promise<T>,
    logger: (message: string, error?: Error) => void
  ): Promise<T> {
    logger('Attempting Safari IndexedDB connection recovery');

    if (typeof db.close === 'function' && typeof db.open === 'function') {
      await db.close();

      // Safari-specific delay to allow IndexedDB to stabilize
      await new Promise((resolve) => setTimeout(resolve, SAFARI_IDB_STABILIZE_DELAY_MS));

      await db.open();

      // Additional small delay before retry to ensure connection is stable
      await new Promise((resolve) => setTimeout(resolve, SAFARI_IDB_POST_OPEN_DELAY_MS));

      logger('Safari IndexedDB connection recovered, retrying operation');
      return await operation();
    } else {
      logger('Database does not support close/open operations');
      throw new Error('Safari IndexedDB recovery not supported');
    }
  }
}

/**
 * Recovery strategies registry
 */
const recoveryStrategies: RecoveryStrategy<any>[] = [
  new SafariConnectionStrategy(),
  new CursorErrorStrategy(),
];

/**
 * Retries a database operation once if it fails with a recoverable error.
 *
 * Handles both cursor errors and Safari IndexedDB connection issues using
 * appropriate recovery strategies.
 *
 * @param db - Database instance with isOpen, open, and close methods
 * @param operation - Async operation to execute and potentially retry
 * @param logger - Optional custom logger function (defaults to console.error)
 * @returns Promise that resolves to the operation result
 * @throws Re-throws the error if retry fails or if it's not a recoverable error
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
    // If DB exposes isOpen, open it when not ready
    if (typeof db.isOpen === 'function' && !db.isOpen()) {
      await db.open?.();
    }

    return await operation();
  } catch (error) {
    const errorInstance = error instanceof Error ? error : new Error(String(error));
    log(`Database operation failed: ${errorInstance.message}`, errorInstance);

    // Try recovery strategies in order of priority
    const recoveryErrors: Error[] = [];

    for (const strategy of recoveryStrategies) {
      if (strategy.canHandle(errorInstance)) {
        try {
          return await strategy.recover(db, operation, log);
        } catch (retryError) {
          const retryErrorInstance =
            retryError instanceof Error ? retryError : new Error(String(retryError));
          log(
            `Error retrying operation after ${strategy.constructor.name}: ${retryErrorInstance.message}`,
            retryErrorInstance
          );
          recoveryErrors.push(retryErrorInstance);
          // Continue to next strategy instead of throwing
        }
      }
    }

    // If recovery strategies were attempted but all failed, log aggregate error info
    if (recoveryErrors.length > 0) {
      const aggregateMessage = `All recovery strategies failed: ${recoveryErrors.map((e) => e.message).join('; ')}`;
      log(aggregateMessage);
    }

    // No recovery strategy found, re-throw original error
    throw errorInstance;
  }
}
