import { defineCustomElements } from '@ionic/pwa-elements/loader';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/auth';
import './index.css';
import reportWebVitals from './reportWebVitals';
import './i18n';

// Optimize font loading - only import essential weights initially
import '@fontsource/roboto/400.css'; // Regular weight only for faster initial load
import '@fontsource/roboto/500.css'; // Medium weight for buttons/headers

// Lazy load additional weights to reduce initial requests
const loadAdditionalFonts = () => {
  import('@fontsource/roboto/300.css').catch(() => {}); // Light weight
  import('@fontsource/roboto/700.css').catch(() => {}); // Bold weight
};

// Load additional fonts after page is interactive
if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(loadAdditionalFonts, { timeout: 2000 });
  } else {
    setTimeout(loadAdditionalFonts, 1000);
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <React.Suspense>
        <App />
      </React.Suspense>
    </AuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

defineCustomElements(window);
