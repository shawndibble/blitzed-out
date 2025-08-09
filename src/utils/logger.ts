/**
 * Production-safe logging utility
 * In development: logs to console
 * In production: only logs errors to console, other levels are suppressed
 */

// type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, isCritical?: boolean, ...args: unknown[]) => void;
  critical: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

const createLogger = (): Logger => ({
  debug: (message: string, ...args: unknown[]) => {
    console.debug(`[DEBUG] ${message}`, ...args);
  },

  info: (message: string, ...args: unknown[]) => {
    console.info(`[INFO] ${message}`, ...args);
  },

  warn: (message: string, isCritical?: boolean, ...args: unknown[]) => {
    // Handle the case where isCritical is passed as a boolean
    const actualArgs = typeof isCritical === 'boolean' ? args : [isCritical, ...args];
    console.warn(`[WARN] ${message}`, ...actualArgs);
  },

  critical: (message: string, ...args: unknown[]) => {
    console.warn(`[CRITICAL] ${message}`, ...args);
  },

  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
});

export const logger = createLogger();

/**
 * Legacy console replacement for gradual migration
 * TODO: Replace all instances with proper logger methods
 */
export const safeConsole = {
  log: console.log,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
  error: console.error,
};
