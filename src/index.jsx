import './index.css';

import App from './App';
import { MinimalAuthProvider } from './context/minimalAuth';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { initializeSentry, SentryErrorBoundary } from './services/sentry';

// Enhanced module loading error handling - uses feature detection instead of user-agent sniffing
if (typeof window !== 'undefined' && !window.importShim) {
  // Add enhanced error handling for module loading failures and method resolution errors
  window.addEventListener('error', function (event) {
    const msg = event.message || (event.error && event.error.message);
    if (msg && typeof msg === 'string') {
      if (
        msg.includes('Importing a module script failed') ||
        msg.includes('Failed to resolve module specifier') ||
        msg.includes('Method not found')
      ) {
        console.warn('Module loading/resolution issue detected:', msg);
        // Attempt to reload the page once to recover from module loading failure
        if (!sessionStorage.getItem('module_reload_attempted')) {
          sessionStorage.setItem('module_reload_attempted', '1');
          setTimeout(() => window.location.reload(), 1000);
          event.preventDefault();
          return;
        }
      }
    }
  });

  // Handle unhandled promise rejections for dynamic imports and method errors
  window.addEventListener('unhandledrejection', function (event) {
    const reason = event.reason;
    if (reason && reason.message) {
      const errorMsg = reason.message;
      if (
        errorMsg.includes('module script failed') ||
        errorMsg.includes('Failed to resolve module specifier') ||
        errorMsg.includes('Method not found')
      ) {
        console.warn('Dynamic import/method resolution failed:', errorMsg);
        event.preventDefault(); // Prevent the error from showing in console as unhandled
      }
    }
  });
}

// Initialize Sentry
initializeSentry();

// Defer non-critical imports to reduce initial bundle size
const loadNonCriticalResources = () => {
  // Load i18n after initial render to reduce bundle
  import('./i18n').catch((error) => {
    console.warn('Failed to load i18n module:', error);
  });

  // Load PWA elements with better error handling
  import('@ionic/pwa-elements/loader')
    .then((module) => {
      if (module?.defineCustomElements) {
        module.defineCustomElements(window);
      }
    })
    .catch((error) => {
      console.warn('Failed to load PWA elements:', error);
    });

  // Load fonts via stylesheet injection instead of dynamic imports (CSS cannot be dynamically imported in production)
  const loadFontStylesheet = (weights, priority = false) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=Roboto:wght@${weights.join(';')}&display=swap`;
    link.crossOrigin = 'anonymous';

    // Add error handling for font loading
    link.onerror = () => {
      console.warn(`Failed to load Roboto font weights: ${weights.join(', ')}`);
    };

    // Insert with appropriate priority
    if (priority) {
      document.head.insertBefore(link, document.head.firstChild);
    } else {
      document.head.appendChild(link);
    }

    return link;
  };

  // Load core font weights immediately
  loadFontStylesheet(['400', '500'], true);

  // Load additional font weights after page is fully loaded
  const loadAdditionalFontWeights = () => {
    // Only load additional weights if connection is reasonable
    const connection =
      navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection || connection.effectiveType !== 'slow-2g') {
      loadFontStylesheet(['300', '700']);
    }
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

// Hide the instant loading screen once React is ready - using safer DOM manipulation
const hideInstantLoading = () => {
  const instantLoading = document.getElementById('instant-loading');
  if (instantLoading) {
    // Add fade out transition
    instantLoading.style.transition = 'opacity 200ms ease-out';
    instantLoading.style.opacity = '0';
    // Use requestAnimationFrame to ensure timing doesn't conflict with React rendering
    requestAnimationFrame(() => {
      setTimeout(() => {
        // Double-check element still exists and has parent before removing
        const element = document.getElementById('instant-loading');
        if (element && element.parentNode && element.parentNode.contains(element)) {
          try {
            element.parentNode.removeChild(element);
          } catch (error) {
            console.warn('Failed to remove instant loading element:', error);
            // Fallback: just hide the element
            element.style.display = 'none';
          }
        }
      }, 250); // Slightly longer delay to avoid React reconciliation conflicts
    });
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SentryErrorBoundary
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
    </SentryErrorBoundary>
  </React.StrictMode>
);

// Hide instant loading immediately when React is ready to avoid double spinners
hideInstantLoading();
