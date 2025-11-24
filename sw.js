
const CACHE_NAME = 'cinematix-v4-static';
// const DATA_CACHE_NAME = 'cinematix-v4-data'; // Reserved for future data caching

// Assets to cache immediately for App Shell
const urlsToCache = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // console.debug('[SW] Opened cache');
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
            // console.debug('[SW] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Filter out non-GET requests
  if (event.request.method !== 'GET') return;

  // 1. Handle HTML Navigation (Network First, Fallback to Cache)
  // This ensures the user gets the latest app version if online, but loads offline if needed.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
            // Cache the latest version of the page
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
            });
            return response;
        })
        .catch(() => {
          // Fallback to cached index.html for SPA offline support
          return caches.match('/index.html').then(res => res || caches.match('/'));
        })
    );
    return;
  }

  // 2. Handle Static Assets (JS, CSS, Images, Fonts) -> Stale-While-Revalidate
  // Serve from cache immediately if available, while updating cache in background.
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
          }).catch(() => {
             // console.debug('Fetch failed for static asset, serving cache if available');
          });

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 3. Default: Network Only (for API calls, external media streams, etc.)
  // We do not cache video streams or dynamic API data in this SW to prevent stale content issues.
  event.respondWith(fetch(event.request));
});
