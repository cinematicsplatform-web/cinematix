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