import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';

// Disable browser's default scroll restoration to prevent starting in the middle of the page
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// Force scroll to top when the page loads
window.addEventListener('load', () => {
  window.scrollTo(0, 0);
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use ./sw.js for relative path to handle sub-paths or different hosting environments safely
    // Also wrap in try-catch to prevent blocking execution if SW fails (e.g. restricted iframe)
    navigator.serviceWorker.register('./sw.js').then(registration => {
      console.log('SW registered successfully:', registration.scope);
    }).catch(registrationError => {
      console.warn('SW registration failed:', registrationError);
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);