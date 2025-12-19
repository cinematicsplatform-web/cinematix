
// Import Firebase scripts for Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// Initialize Firebase in SW (Use the same config as your app)
// Note: In production, these values should ideally be injected during build, but for this structure we use direct initialization or pull from a shared config if possible.
// We will use a generic placeholder here which usually works if the main app is initialized, but explicit init is safer for background SW.
// REPLACE THESE WITH YOUR ACTUAL CONFIG IF THEY DIFFER
const firebaseConfig = {
  apiKey: "AIzaSyBVK0Zla5VD05Hgf4QqExAWUuXX64odyes", 
  authDomain: "cinematic-d3697.firebaseapp.com",
  projectId: "cinematic-d3697", 
  storageBucket: "cinematic-d3697.firebasestorage.app", 
  messagingSenderId: "247576999692",
  appId: "1:247576999692:web:309f001a211dc1b150fb29", 
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle Background Messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/icon-192.png', // Fallback icon
    image: payload.notification.image,
    data: payload.data // Store extra data (like URL) here
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// --- Existing Cache Logic ---

const CACHE_NAME = 'cinematix-v4-static';

const urlsToCache = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// --- Deep Linking Click Handler ---
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Get URL from data payload (Admin Panel sends 'url' in data)
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(windowClients) {
      // Check if there is already a window open with this URL
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
            });
            return response;
        })
        .catch(() => {
          return caches.match('/index.html').then(res => res || caches.match('/'));
        })
    );
    return;
  }

  const isStaticAsset = 
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|json|ico|woff2)$/) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {});

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  event.respondWith(fetch(event.request));
});
