/**
 * Centralized error handling utilities for the migration service
 */

export type ErrorLevel = 'debug' | 'warn' | 'error';

/**
 * Standardized error logging with consistent format
 */
export const logError = (
  level: ErrorLevel,
  context: string,
  error: unknown,
  details?: any
): void => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const logMessage = `[Migration ${context}] ${errorMessage}`;

  if (details) {
    console[level](logMessage, details);
  } else {
    console[level](logMessage);
  }
};

/**
 * Safe localStorage operation wrapper
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      logError('warn', 'localStorage.getItem', error, { key });
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      logError('warn', 'localStorage.setItem', error, { key });
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      logError('warn', 'localStorage.removeItem', error, { key });
      return false;
    }
  },

  getJSON: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      logError('warn', 'localStorage.getJSON', error, { key });
      return null;
    }
  },

  setJSON: (key: string, value: any): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logError('warn', 'localStorage.setJSON', error, { key });
      return false;
    }
  },
};

/**
 * Async operation wrapper with consistent error handling
 */
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: string,
  fallback?: T
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    logError('error', context, error);
    return fallback ?? null;
  }
};

/**
 * Check if an error indicates a duplicate/conflict that can be safely ignored
 */
export const isDuplicateError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes('already exists') ||
      error.message.includes('duplicate') ||
      error.message.includes('unique constraint')
    );
  }
  return false;
};
