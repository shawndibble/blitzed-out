import * as Sentry from '@sentry/react';

interface FirefoxMobileContext {
  userAgent: string;
  url: string;
  timestamp: string;
  connectivity: {
    online: boolean;
    cookiesEnabled: boolean;
    localStorageAvailable: boolean;
    connectionType?: string;
  };
  firebase: {
    hasApiKey: boolean;
    hasAuthDomain: boolean;
    authDomain?: string;
  };
  authentication?: {
    step: string;
    displayName?: string;
    room?: string;
    firebaseUser?: {
      uid?: string;
      isAnonymous?: boolean;
    };
  };
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

function isFirefoxMobile(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    userAgent.includes('firefox') && (userAgent.includes('mobile') || userAgent.includes('tablet'))
  );
}

function gatherSystemContext(): Partial<FirefoxMobileContext> {
  return {
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    connectivity: {
      online: navigator.onLine,
      cookiesEnabled: navigator.cookieEnabled,
      localStorageAvailable: typeof Storage !== 'undefined',
      connectionType: (navigator as any).connection?.effectiveType || 'unknown',
    },
    firebase: {
      hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
      hasAuthDomain: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    },
  };
}

export function reportFirefoxMobileAuthError(
  step: string,
  error: Error,
  additionalContext?: Partial<FirefoxMobileContext>
): void {
  // Only report for Firefox mobile users
  if (!isFirefoxMobile()) {
    return;
  }

  const context: FirefoxMobileContext = {
    ...gatherSystemContext(),
    authentication: {
      step,
      ...additionalContext?.authentication,
    },
    error: {
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
    },
    ...additionalContext,
  } as FirefoxMobileContext;

  // Send to Sentry with detailed context
  Sentry.withScope((scope) => {
    scope.setTag('firefox_mobile_auth_error', true);
    scope.setTag('auth_step', step);
    scope.setLevel('error');

    // Add all context as extra data
    scope.setContext('firefox_mobile_debug', context as any);

    // Set user context if available
    if (context.authentication?.displayName) {
      scope.setUser({
        username: context.authentication.displayName,
        id: context.authentication.firebaseUser?.uid || 'anonymous',
      });
    }

    // Add breadcrumbs for authentication flow
    scope.addBreadcrumb({
      message: `Firefox Mobile Auth Step: ${step}`,
      level: 'info',
      data: context.authentication,
    });

    Sentry.captureException(error);
  });

  // Add breadcrumb for easier filtering without duplicate notifications
  Sentry.addBreadcrumb({
    message: `Firefox Mobile Authentication Failure - ${step}: ${error.message}`,
    level: 'error',
    category: 'firefox_mobile_auth',
  });
}

export function reportFirefoxMobileConnectivityIssue(details: {
  testUrl: string;
  error: Error;
}): void {
  if (!isFirefoxMobile()) {
    return;
  }

  const context: FirefoxMobileContext = {
    ...gatherSystemContext(),
    authentication: {
      step: 'connectivity_check',
    },
    error: {
      message: details.error.message,
      stack: details.error.stack,
    },
  } as FirefoxMobileContext;

  Sentry.withScope((scope) => {
    scope.setTag('firefox_mobile_connectivity_error', true);
    scope.setLevel('warning');
    scope.setContext('connectivity_test', {
      testUrl: details.testUrl,
      ...context,
    } as any);

    Sentry.captureMessage(
      `Firefox Mobile Connectivity Issue: Failed to reach ${details.testUrl}. This may indicate uBlock Origin or another adblocker is blocking Firebase.`,
      'warning'
    );
  });
}
