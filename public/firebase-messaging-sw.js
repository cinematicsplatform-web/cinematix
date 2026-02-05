
/* public/firebase-messaging-sw.js */
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

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
  
  const notificationTitle = payload.notification.title || "تنبيه جديد من سينماتيكس";
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/android-chrome-192x192.png',
    image: payload.notification.image || payload.data?.image,
    badge: '/favicon-32x32.png',
    data: payload.data, // Store extra data (like URL) here
    tag: payload.data?.broadcastId || 'cinematix-global-alert',
    renotify: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Deep Linking Click Handler
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Get URL from data payload
  let targetUrl = event.notification.data?.url || '/';
  
  // Ensure absolute URL if it starts with /
  if (targetUrl.startsWith('/')) {
      targetUrl = self.location.origin + targetUrl;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
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
