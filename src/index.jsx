import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/auth';
import './index.css';

// Defer non-critical imports to reduce initial bundle size
const loadNonCriticalResources = () => {
  // Load i18n after initial render to reduce bundle
  import('./i18n').catch(console.error);

  // Load PWA elements after initial render
  import('@ionic/pwa-elements/loader')
    .then(({ defineCustomElements }) => {
      defineCustomElements(window);
    })
    .catch(console.error);

  // Load fonts after initial render
  Promise.all([import('@fontsource/roboto/400.css'), import('@fontsource/roboto/500.css')]).catch(
    console.error
  );

  // Load additional font weights after page is interactive
  setTimeout(() => {
    Promise.all([import('@fontsource/roboto/300.css'), import('@fontsource/roboto/700.css')]).catch(
      console.error
    );
  }, 1000);
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
    <AuthProvider>
      <React.Suspense fallback={null}>
        <App />
      </React.Suspense>
    </AuthProvider>
  </React.StrictMode>
);

// Hide instant loading immediately when React is ready to avoid double spinners
hideInstantLoading();
