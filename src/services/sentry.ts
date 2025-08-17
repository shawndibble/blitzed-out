import * as Sentry from '@sentry/react';
import {
  isExpectedDOMError,
  isModuleLoadingError,
  ERROR_CATEGORIES,
} from '@/constants/errorPatterns';

/**
 * Initialize Sentry error tracking and monitoring
 */

export function initializeSentry(): void {
  // Idempotency guard: prevent double initialization (HMR, repeated calls)
  if (Sentry.getClient() !== undefined) {
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE, // 'development' or 'production'
    debug: false, // Disable verbose debug logging to keep console clean
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false, // Set to true if you want to mask sensitive text
        blockAllMedia: false, // Set to true if you want to block images/videos
      }),
    ],
    tracesSampleRate: 0.2, // Capture 20% of transactions for performance monitoring
    replaysSessionSampleRate: 0.1, // Capture 10% of sessions for replay
    replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions when errors occur
    beforeSend(event) {
      // Don't send events in development unless you want to
      if (import.meta.env.MODE === 'development') {
        // Send events for Firefox mobile in development to help debug
        const userAgent = navigator.userAgent.toLowerCase();
        const isFirefoxMobile =
          userAgent.includes('firefox') &&
          (userAgent.includes('mobile') || userAgent.includes('tablet'));

        if (!isFirefoxMobile) {
          return null; // Don't send to Sentry in development for other browsers
        }

        // Use Sentry context instead of console.log for debugging
        Sentry.setTag('development_debug', 'firefox_mobile_detected');
      }

      const errorMessage = event.exception?.values?.[0]?.value || event.message || '';
      const errorMessageLower = errorMessage.toLowerCase();

      // Tag iOS Safari module errors for better tracking
      if (errorMessage.includes('Importing a module script failed')) {
        event.tags = { ...(event.tags ?? {}), [ERROR_CATEGORIES.IOS_SAFARI_MODULE]: true };
        if (!event.fingerprint?.length) {
          event.fingerprint = ['ios-safari-module-loading-error'];
        }
      }

      // Filter out expected React DOM insertion errors during normal reconciliation
      // These occur during state transitions when GameSettingsDialog unmounts and game board mounts
      if (isExpectedDOMError(errorMessage)) {
        // Don't send these expected React reconciliation errors to Sentry
        // These happen during normal operation when transitioning from GameSettingsDialog to game board
        return null;
      }

      // Tag other DOM insertion errors for tracking (unexpected ones)
      if (
        errorMessage.includes('insertBefore') ||
        errorMessage.includes('not a child of this node')
      ) {
        event.tags = { ...(event.tags ?? {}), [ERROR_CATEGORIES.DOM_RECONCILIATION]: true };
        if (!event.fingerprint?.length) {
          event.fingerprint = ['react-dom-insertion-error'];
        }
      }

      // Tag module resolution and method not found errors
      if (isModuleLoadingError(errorMessage)) {
        event.tags = { ...(event.tags ?? {}), [ERROR_CATEGORIES.MODULE_LOADING]: true };
        if (!event.fingerprint?.length) {
          event.fingerprint = ['module-resolution-error'];
        }
      }

      // Tag Firefox mobile specific errors
      const userAgent = navigator.userAgent.toLowerCase();
      const isFirefoxMobile =
        userAgent.includes('firefox') &&
        (userAgent.includes('mobile') || userAgent.includes('tablet'));

      if (isFirefoxMobile) {
        event.tags = { ...(event.tags ?? {}), firefox_mobile: true };

        // Tag authentication-related errors specifically
        if (
          errorMessageLower.includes('login') ||
          errorMessageLower.includes('auth') ||
          errorMessageLower.includes('firebase')
        ) {
          event.tags = { ...(event.tags ?? {}), [ERROR_CATEGORIES.FIREFOX_MOBILE_AUTH]: true };
          if (!event.fingerprint?.length) {
            event.fingerprint = ['firefox-mobile-auth-error'];
          }
        }
      }

      return event;
    },
  });
}

/**
 * Enhanced error boundary component with Sentry integration
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;
