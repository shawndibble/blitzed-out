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

const isProduction = process.env.NODE_ENV === 'production';

const createLogger = (): Logger => ({
  debug: (message: string, ...args: unknown[]) => {
    if (!isProduction) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },

  info: (message: string, ...args: unknown[]) => {
    if (!isProduction) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  warn: (message: string, isCritical?: boolean, ...args: unknown[]) => {
    // Handle the case where isCritical is passed as a boolean
    const actualArgs = typeof isCritical === 'boolean' ? args : [isCritical, ...args];
    const critical = typeof isCritical === 'boolean' ? isCritical : false;

    if (!isProduction || critical) {
      console.warn(`[WARN] ${message}`, ...actualArgs);
    }
  },

  critical: (message: string, ...args: unknown[]) => {
    // Always log critical warnings, even in production
    console.warn(`[CRITICAL] ${message}`, ...args);
  },

  error: (message: string, ...args: unknown[]) => {
    // Always log errors, even in production
    console.error(`[ERROR] ${message}`, ...args);
  },
});

export const logger = createLogger();

/**
 * Legacy console replacement for gradual migration
 * TODO: Replace all instances with proper logger methods
 */
export const safeConsole = {
  log: (message: string, ...args: unknown[]) => {
    if (!isProduction) {
      console.log(message, ...args);
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (!isProduction) {
      console.warn(message, ...args);
    }
  },

  info: (message: string, ...args: unknown[]) => {
    if (!isProduction) {
      console.info(message, ...args);
    }
  },

  debug: (message: string, ...args: unknown[]) => {
    if (!isProduction) {
      console.debug(message, ...args);
    }
  },

  // Always preserve error logging
  error: console.error,
};
