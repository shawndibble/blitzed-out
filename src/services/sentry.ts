import * as Sentry from '@sentry/react';

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

      // Tag iOS Safari module errors for better tracking
      if (event.exception?.values?.[0]?.value?.includes('Importing a module script failed')) {
        event.tags = { ...event.tags, ios_safari_module_error: true };
        event.fingerprint = ['ios-safari-module-loading-error'];
      }

      // Tag React DOM insertion errors for better tracking
      if (
        event.exception?.values?.[0]?.value?.includes('insertBefore') ||
        event.exception?.values?.[0]?.value?.includes('not a child of this node')
      ) {
        event.tags = { ...event.tags, react_dom_insertion_error: true };
        event.fingerprint = ['react-dom-insertion-error'];
      }

      // Tag module resolution and method not found errors
      if (
        event.exception?.values?.[0]?.value?.includes('Method not found') ||
        event.exception?.values?.[0]?.value?.includes('Failed to resolve module specifier')
      ) {
        event.tags = { ...event.tags, module_resolution_error: true };
        event.fingerprint = ['module-resolution-error'];
      }

      // Tag Firefox mobile specific errors
      const userAgent = navigator.userAgent.toLowerCase();
      const isFirefoxMobile =
        userAgent.includes('firefox') &&
        (userAgent.includes('mobile') || userAgent.includes('tablet'));

      if (isFirefoxMobile) {
        event.tags = { ...event.tags, firefox_mobile: true };

        // Tag authentication-related errors specifically
        if (
          event.exception?.values?.[0]?.value?.includes('login') ||
          event.exception?.values?.[0]?.value?.includes('auth') ||
          event.exception?.values?.[0]?.value?.includes('firebase') ||
          event.message?.includes('login') ||
          event.message?.includes('auth')
        ) {
          event.tags = { ...event.tags, firefox_mobile_auth_error: true };
          event.fingerprint = ['firefox-mobile-auth-error'];
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
