/**
 * Simple logger utility for client-side logging
 * Provides console logging with optional Sentry integration for production
 */

interface Logger {
  debug: (message: string, data?: any) => void;
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, data?: any) => void;
}

const isDevelopment = ['development', 'test'].includes(import.meta.env.MODE);

const createLogger = (): Logger => {
  const log = (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) => {
    // Always log to console in development, only warn/error in production
    if (isDevelopment || level === 'warn' || level === 'error') {
      const logFn = console[level] || console.log;
      if (data) {
        logFn(`[${level.toUpperCase()}] ${message}`, data);
      } else {
        logFn(`[${level.toUpperCase()}] ${message}`);
      }
    }

    // In production, you could also send errors to Sentry here
    // if (level === 'error' && window.Sentry) {
    //   window.Sentry.captureMessage(message, 'error');
    // }
  };

  return {
    debug: (message: string, data?: any) => log('debug', message, data),
    info: (message: string, data?: any) => log('info', message, data),
    warn: (message: string, data?: any) => log('warn', message, data),
    error: (message: string, data?: any) => log('error', message, data),
  };
};

export const logger = createLogger();
