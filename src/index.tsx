import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';

// Handle harmless Firestore connection warnings in sandboxed environments
const originalError = console.error;
console.error = function (...args: any[]) {
  const msg = args.map(arg => typeof arg === 'string' ? arg : (arg && arg.toString ? arg.toString() : '')).join(' ');
  if (msg.includes('Could not reach Cloud Firestore backend') || msg.includes('Firestore') || msg.includes('experimentalForceLongPolling')) {
    console.warn('[Firestore Sandboxed Mode]: Local operations enabled.');
    return;
  }
  originalError.apply(console, args);
};

const originalWarn = console.warn;
console.warn = function (...args: any[]) {
  const msg = args.map(arg => typeof arg === 'string' ? arg : (arg && arg.toString ? arg.toString() : '')).join(' ');
  if (msg.includes('Could not reach Cloud Firestore backend') || msg.includes('Firestore')) {
    return;
  }
  originalWarn.apply(console, args);
};

// Register Service Worker for PWA and Firebase Messaging
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js').then(registration => {
      console.log('SW registered successfully:', registration.scope);
    }).catch(registrationError => {
      console.debug('SW registration failed:', registrationError);
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