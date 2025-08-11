import './index.css';

import * as Sentry from '@sentry/react';

import App from './App';
import { MinimalAuthProvider } from './context/minimalAuth';
import React from 'react';
import ReactDOM from 'react-dom/client';

// Enhanced module loading error handling - uses feature detection instead of user-agent sniffing
if (typeof window !== 'undefined' && !window.importShim) {
  // Add enhanced error handling for module loading failures (primarily Safari)
  window.addEventListener('error', function (event) {
    const msg = event.message || (event.error && event.error.message);
    if (msg && typeof msg === 'string' && msg.includes('Importing a module script failed')) {
      console.warn('Module loading issue detected, attempting recovery...');
      // Attempt to reload the page once to recover from module loading failure
      if (!sessionStorage.getItem('module_reload_attempted')) {
        sessionStorage.setItem('module_reload_attempted', '1');
        setTimeout(() => window.location.reload(), 100);
        event.preventDefault();
        return;
      }
    }
  });

  // Handle unhandled promise rejections for dynamic imports
  window.addEventListener('unhandledrejection', function (event) {
    const reason = event.reason;
    if (reason && reason.message && reason.message.includes('module script failed')) {
      console.warn('Dynamic import failed, preventing error escalation');
      event.preventDefault(); // Prevent the error from showing in console as unhandled
    }
  });
}

// Initialize Sentry
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

    return event;
  },
});

// Defer non-critical imports to reduce initial bundle size
const loadNonCriticalResources = () => {
  // Wrap all dynamic imports with proper error handling for Safari compatibility
  const safeDynamicImport = async (importPath) => {
    try {
      return await import(importPath);
    } catch (error) {
      // Safari-specific error handling for module loading failures
      console.warn(`Failed to load module ${importPath}:`, error);
      return null;
    }
  };

  // Load i18n after initial render to reduce bundle
  safeDynamicImport('./i18n').catch(console.error);

  // Load PWA elements after initial render with Safari compatibility
  safeDynamicImport('@ionic/pwa-elements/loader')
    .then((module) => {
      if (module?.defineCustomElements) {
        module.defineCustomElements(window);
      }
    })
    .catch(console.error);

  // Load fonts after initial render with Safari compatibility
  Promise.all([
    safeDynamicImport('@fontsource/roboto/400.css'),
    safeDynamicImport('@fontsource/roboto/500.css'),
  ]).catch(console.error);

  // Load additional font weights after page is fully loaded
  const loadAdditionalFontWeights = () => {
    Promise.all([
      safeDynamicImport('@fontsource/roboto/300.css'),
      safeDynamicImport('@fontsource/roboto/700.css'),
    ]).catch(console.error);
  };

  if (document.readyState === 'complete') {
    loadAdditionalFontWeights();
  } else {
    window.addEventListener('load', loadAdditionalFontWeights, { once: true });
  }
};

// Schedule non-critical resource loading
if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(loadNonCriticalResources, { timeout: 500 });
  } else {
    setTimeout(loadNonCriticalResources, 100);
  }
}

// Hide the instant loading screen once React is ready
const hideInstantLoading = () => {
  const instantLoading = document.getElementById('instant-loading');
  if (instantLoading) {
    // Add fade out transition
    instantLoading.style.transition = 'opacity 200ms ease-out';
    instantLoading.style.opacity = '0';
    // Remove from DOM after fade out to free memory
    setTimeout(() => {
      if (instantLoading.parentNode) {
        instantLoading.parentNode.removeChild(instantLoading);
      }
    }, 200);
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>The error has been reported to our team.</p>
          <details style={{ marginTop: '10px' }}>
            <summary>Error details</summary>
            <pre
              style={{
                textAlign: 'left',
                background: '#f5f5f5',
                padding: '10px',
                margin: '10px 0',
              }}
            >
              {error.toString()}
            </pre>
          </details>
          <button onClick={resetError} style={{ padding: '10px 20px', marginTop: '10px' }}>
            Try again
          </button>
        </div>
      )}
    >
      <MinimalAuthProvider>
        <React.Suspense fallback={null}>
          <App />
        </React.Suspense>
      </MinimalAuthProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);

// Hide instant loading immediately when React is ready to avoid double spinners
hideInstantLoading();
