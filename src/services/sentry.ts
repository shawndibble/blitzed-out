import * as Sentry from '@sentry/react';
import React from 'react';
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom';

/**
 * Error patterns to ignore - move simple patterns here instead of beforeSend
 */
const IGNORED_ERROR_PATTERNS = [
  // iOS Safari module loading errors - not actionable, iOS Safari bug
  /module script failed/i,
  // Expected React DOM reconciliation errors during normal transitions
  /The node to be removed is not a child of this node/i,
  /Cannot read.*insertBefore/i,
  // Safari IndexedDB quirks in private browsing
  /cannot open cursor to perform index gets/i,
  // User-initiated browser data deletion
  /database deleted by request of the user/i,
];

/**
 * Network/loading error patterns - filtered contextually in beforeSend
 */
const NETWORK_ERROR_PATTERNS = [
  /loading chunk.*failed/i,
  /failed to fetch/i,
  /networkerror/i,
  /load failed/i,
];

/**
 * Check if error is a network/loading error
 */
function isNetworkError(message: string): boolean {
  return NETWORK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Simplified beforeSend - only handle complex contextual filtering
 */
function beforeSendHandler(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
  const errorMessage = event.exception?.values?.[0]?.value || event.message || '';
  const userAgent = navigator.userAgent.toLowerCase();

  // Filter network errors only on Safari or when no stack trace exists
  if (isNetworkError(errorMessage)) {
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
    const hasNoStacktrace = !event.exception?.values?.[0]?.stacktrace?.frames?.length;

    // Only suppress on Safari or without stacktrace (likely browser quirk)
    if (isSafari || hasNoStacktrace) {
      return null;
    }

    // For non-Safari with stacktrace, tag for investigation
    event.tags = { ...(event.tags ?? {}), network_error_with_trace: true };
  }

  // Don't send events in development (except Firefox mobile for debugging)
  if (import.meta.env.MODE === 'development') {
    const isFirefoxMobile =
      userAgent.includes('firefox') &&
      (userAgent.includes('mobile') || userAgent.includes('tablet'));

    if (!isFirefoxMobile) {
      return null;
    }
  }

  return event;
}

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
    environment: import.meta.env.MODE,

    // Use ignoreErrors for simple pattern matching (more efficient than beforeSend)
    ignoreErrors: IGNORED_ERROR_PATTERNS,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
      // React Router integration for better transaction names
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      // Filter out third-party errors (browser extensions, injected scripts)
      Sentry.thirdPartyErrorFilterIntegration({
        filterKeys: ['blitzed-out'], // Add your app identifier
        behaviour: 'drop-error-if-contains-third-party-frames',
      }),
    ],

    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Only use beforeSend for complex contextual filtering
    beforeSend: beforeSendHandler,
  });
}

/**
 * Enhanced error boundary component with Sentry integration
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;
