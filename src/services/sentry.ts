import * as Sentry from '@sentry/react';
import {
  isExpectedDOMError,
  isModuleLoadingError,
  isNetworkLoadingError,
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
      // Compute user agent once and reuse
      const userAgentLower = (navigator.userAgent || '').toLowerCase();
      const isFirefoxMobile =
        userAgentLower.includes('firefox') &&
        (userAgentLower.includes('mobile') || userAgentLower.includes('tablet'));

      // Don't send events in development unless you want to
      if (import.meta.env.MODE === 'development') {
        // Send events for Firefox mobile in development to help debug

        if (!isFirefoxMobile) {
          return null; // Don't send to Sentry in development for other browsers
        }

        // Use Sentry context instead of console.log for debugging
        Sentry.setTag('development_debug', 'firefox_mobile_detected');
      }

      const errorMessage = event.exception?.values?.[0]?.value || event.message || '';
      const errorMessageLower = errorMessage.toLowerCase();

      // Filter out iOS Safari module loading errors - not actionable, iOS Safari bug
      // Users experience this when iOS aggressively kills network requests or has cache issues
      // Solution: user refreshes the page
      if (errorMessageLower.includes('module script failed')) {
        return null;
      }

      // Filter out expected React DOM insertion errors during normal reconciliation
      // These occur during state transitions when GameSettingsDialog unmounts and game board mounts
      if (isExpectedDOMError(errorMessage)) {
        // Don't send these expected React reconciliation errors to Sentry
        // These happen during normal operation when transitioning from GameSettingsDialog to game board
        return null;
      }

      // Filter out generic network/loading errors that are usually temporary
      // These are often Safari "Load failed" errors or network hiccups, not actionable bugs
      // Only suppress on Safari or when there's no stacktrace to avoid masking real backend/CORS failures
      if (isNetworkLoadingError(errorMessage)) {
        const isSafari = userAgentLower.includes('safari') && !userAgentLower.includes('chrome');
        const hasNoStacktrace = !event.exception?.values?.[0]?.stacktrace?.frames?.length;

        if (isSafari || hasNoStacktrace) {
          return null;
        }

        // For non-Safari browsers with stacktrace, tag but don't suppress
        event.tags = { ...(event.tags ?? {}), network_loading_error: true };
        if (!event.fingerprint?.length) {
          event.fingerprint = ['network-loading-error-with-trace'];
        }
      }

      // Filter out rare Safari IndexedDB cursor errors (private browsing, quota issues)
      // Only 1 occurrence in last 30 days - not actionable, Safari browser quirk
      if (errorMessageLower.includes('cannot open cursor to perform index gets')) {
        return null;
      }

      // Filter out user-initiated database deletions (Safari: Clear History and Website Data)
      // Not an error - expected behavior when users clear browser data
      if (errorMessageLower.includes('database deleted by request of the user')) {
        return null;
      }

      // Tag other DOM insertion errors for tracking (unexpected ones)
      if (
        errorMessageLower.includes('insertbefore') ||
        errorMessageLower.includes('not a child of this node')
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
