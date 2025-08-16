import 'vite/modulepreload-polyfill';
import './index.css';

import App from './App';
import { MinimalAuthProvider } from './context/minimalAuth';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { initializeSentry, SentryErrorBoundary } from '@/services/sentry';
import { logger } from '@/utils/logger';
import ErrorBoundaryFallback from '@/components/ErrorBoundaryFallback';
import './i18n'; // Load i18n statically
import { defineCustomElements } from '@ionic/pwa-elements/loader';

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
        logger.warn('Module loading/resolution issue detected:', { message: msg, event });
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
        logger.warn('Dynamic import/method resolution failed:', { message: errorMsg, reason });
        event.preventDefault(); // Prevent the error from showing in console as unhandled
      }
    }
  });
}

// Initialize Sentry
initializeSentry();

// Initialize PWA elements
const initializePWAElements = () => {
  try {
    defineCustomElements(window);
  } catch (error) {
    logger.warn('Failed to load PWA elements:', error);
  }
};

// Load fonts via stylesheet injection instead of dynamic imports (CSS cannot be dynamically imported in production)
const loadFontStylesheet = (weights, priority = false) => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=Roboto:wght@${weights.join(';')}&display=swap`;
  link.crossOrigin = 'anonymous';

  // Add error handling for font loading
  link.onerror = () => {
    logger.warn('Failed to load Roboto font weights:', { weights });
  };

  // Insert with appropriate priority
  if (priority) {
    document.head.insertBefore(link, document.head.firstChild);
  } else {
    document.head.appendChild(link);
  }

  return link;
};

// Initialize PWA elements and fonts
if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(
      () => {
        initializePWAElements();
        loadFontStylesheet(['400', '500'], true);
        // Load additional font weights after page is fully loaded
        if (document.readyState === 'complete') {
          const connection =
            navigator.connection || navigator.mozConnection || navigator.webkitConnection;
          if (!connection || connection.effectiveType !== 'slow-2g') {
            loadFontStylesheet(['300', '700']);
          }
        } else {
          window.addEventListener(
            'load',
            () => {
              const connection =
                navigator.connection || navigator.mozConnection || navigator.webkitConnection;
              if (!connection || connection.effectiveType !== 'slow-2g') {
                loadFontStylesheet(['300', '700']);
              }
            },
            { once: true }
          );
        }
      },
      { timeout: 500 }
    );
  } else {
    setTimeout(() => {
      initializePWAElements();
      loadFontStylesheet(['400', '500'], true);
    }, 100);
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
            logger.warn('Failed to remove instant loading element:', error);
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
    <SentryErrorBoundary fallback={ErrorBoundaryFallback}>
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
