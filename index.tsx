
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use ./sw.js for relative path to handle sub-paths or different hosting environments safely
    navigator.serviceWorker.register('./sw.js').then(registration => {
      console.log('SW registered successfully:', registration.scope);
    }).catch(registrationError => {
      // Suppress warning in console for cleaner logs in restricted environments
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
