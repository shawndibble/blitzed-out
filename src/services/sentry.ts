import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry error tracking and monitoring
 */
export function initializeSentry(): void {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE, // 'development' or 'production'
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
        console.log('Sentry Event:', event);
        return null; // Don't send to Sentry in development
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

      return event;
    },
  });
}

/**
 * Enhanced error boundary component with Sentry integration
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;
