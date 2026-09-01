import * as Sentry from '@sentry/react';
import React from 'react';
import { AUDIO_DEVICE_START_ERROR } from '@/constants/errorPatterns';
import {
  isInjectedScriptStackOverflow,
  isOpaqueStacklessError,
  isProxyRewrittenHostCall,
} from '@/services/sentryFilters';
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom';

/**
 * Matched against the message alone. Anything needing the stack frames goes in `sentryFilters.ts`
 * and is called from `beforeSend`; `docs/engineering/security.md` holds the seam rules.
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
  // User dismissed permission prompts (camera, microphone, etc.)
  /NotAllowedError/i,
  /permission denied/i,
  /user denied permission/i,
  /not allowed by the user agent/i,
  // User navigated away / fetch aborted mid-flight — not actionable
  /AbortError/i,
  /the user aborted a request/i,
  // Rejected promise with no value — nothing to act on (known noisy pattern)
  /Non-Error promise rejection captured/i,
  // Message-matched, not type-matched: real Dexie/WebRTC bugs also throw `InvalidStateError`.
  // `src/index.jsx` cancels the same rejection, which silences the console but not Sentry.
  new RegExp(AUDIO_DEVICE_START_ERROR, 'i'),
  // `extractMessage` substitutes this placeholder for a blank message; anchoring on it keeps an
  // NS_ERROR_FAILURE that says what failed. Origin and consequences: security.md § Sentry.
  /^NS_ERROR_FAILURE: No error message$/,
  // IndexedDB closed under a live consumer — teardown or iOS backgrounding, not app misuse.
  // Anchored on the condition, not the `Failed to execute 'x' on 'y'` prefix naming the caller.
  // Origin, and the Dexie false positive accepted with it: security.md § Sentry.
  /the database connection is closing/i,
  // Storage (IndexedDB/localStorage) entirely blocked — iOS Lockdown Mode, aggressive
  // tracking prevention, or similarly locked-down private browsing. Thrown from Dexie's
  // internal cross-tab polling (`indexedDB.databases()`) and Firestore's `SharedClientState`
  // localStorage check, both vendor code the app cannot wrap in a try/catch. Anchored on the
  // exact `type: value` wording rather than a bare substring — WebKit reuses "SecurityError"
  // for unrelated tainted-canvas access, which this must not swallow. Origin: security.md § Sentry.
  /^SecurityError: The operation is insecure\.$/,
];

/**
 * Network/loading error patterns - filtered contextually in beforeSend
 */
const NETWORK_ERROR_PATTERNS = [
  /loading chunk.*failed/i,
  /failed to fetch/i,
  /networkerror/i,
  /load failed/i,
  // Vite's preload helper, once `lazyWithRetry` has exhausted its attempts. Surviving three
  // tries means the connection is gone, not that the asset is wrong.
  /unable to preload css/i,
];

/**
 * Check if error is a network/loading error
 */
function isNetworkError(message: string): boolean {
  return NETWORK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Check if error originates from Sentry Replay/rrweb by inspecting stack frames
 */
function isRrwebReplayError(event: Sentry.ErrorEvent): boolean {
  const frames = event.exception?.values?.[0]?.stacktrace?.frames || [];
  return frames.some((frame) => {
    const filename = frame.filename || '';
    const module = frame.module || '';
    return (
      filename.includes('rrweb') ||
      filename.includes('replay') ||
      module.includes('rrweb') ||
      module.includes('replay')
    );
  });
}

/**
 * Simplified beforeSend - only handle complex contextual filtering
 */
function beforeSendHandler(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
  const errorMessage = event.exception?.values?.[0]?.value || event.message || '';
  const userAgent = navigator.userAgent.toLowerCase();

  // Filter rrweb/Replay internal feature errors (DuckDuckGo/privacy browsers)
  // Only suppress when both the message matches AND the error comes from rrweb
  if (/feature named.*was not found/i.test(errorMessage) && isRrwebReplayError(event)) {
    return null;
  }

  // Raised by code that is not ours — though not always from outside our bundle, since
  // `isProxyRewrittenHostCall` fires on events that also carry one of our chunks. All three read
  // the stack frames, so none can be expressed as an `ignoreErrors` pattern.
  if (
    isOpaqueStacklessError(event) ||
    isInjectedScriptStackOverflow(event) ||
    isProxyRewrittenHostCall(event)
  ) {
    return null;
  }

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
 * Split from `initializeSentry` so the test asserts the `ignoreErrors` production sends: reading
 * the pattern array directly would stay green if it were never wired into `Sentry.init`.
 */
export function buildSentryOptions(): Sentry.BrowserOptions {
  // No `thirdPartyErrorFilterIntegration` here, deliberately. It needs the module
  // metadata that `sentryVitePlugin` injects, and that plugin only registers when
  // `SENTRY_UPLOAD_SOURCEMAPS=true` — which nothing sets. Frames without metadata
  // all look third-party, so the filter dropped **every** stack-traced error in
  // production while reporting looked healthy. Extension and browser noise is
  // handled by `ignoreErrors` and `beforeSend` instead, neither of which depends on
  // a build flag. Re-registering the filter is only safe alongside making that
  // plugin unconditional.
  return {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,

    // Matches the **last** exception value, where the thrown error lives once
    // `linkedErrorsIntegration` has chained a `cause` in front of it.
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
    ],

    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    beforeSend: beforeSendHandler,
  };
}

export function initializeSentry(): void {
  if (import.meta.env.MODE === 'test') {
    return;
  }

  // Idempotency guard: prevent double initialization (HMR, repeated calls)
  if (Sentry.getClient() !== undefined) {
    return;
  }

  Sentry.init(buildSentryOptions());
}

/**
 * Enhanced error boundary component with Sentry integration
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;
