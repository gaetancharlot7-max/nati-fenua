// Firebase Messaging Service Worker
// Nati Fenua - Push Notifications

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC23csAHff4HbX644VEBOLCcaChQyTbOMo",
  authDomain: "nati-fenua-c66b2.firebaseapp.com",
  projectId: "nati-fenua-c66b2",
  storageBucket: "nati-fenua-c66b2.firebasestorage.app",
  messagingSenderId: "598193673874",
  appId: "1:598193673874:web:ca0e01c652caea4b1bf84b"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Nati Fenua';
  const notificationOptions = {
    body: payload.notification?.body || 'Vous avez une nouvelle notification',
    icon: '/icons/nati-fenua-192.png',
    badge: '/icons/nati-fenua-64.png',
    vibrate: [100, 50, 100],
    tag: payload.data?.type || 'default',
    data: payload.data || {},
    actions: [
      {
        action: 'open',
        title: 'Ouvrir'
      },
      {
        action: 'dismiss',
        title: 'Ignorer'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Get the URL to open based on notification data
  const data = event.notification.data || {};
  let urlToOpen = '/feed';
  
  if (data.type === 'message') {
    urlToOpen = `/chat/${data.conversationId || ''}`;
  } else if (data.type === 'comment' || data.type === 'like') {
    urlToOpen = `/post/${data.postId || ''}`;
  } else if (data.type === 'follow') {
    urlToOpen = `/profile/${data.userId || ''}`;
  } else if (data.type === 'mana') {
    urlToOpen = '/mana';
  } else if (data.url) {
    urlToOpen = data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If there's already a window open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: urlToOpen,
            data: data
          });
          return;
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle push event (fallback)
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received');
  
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[firebase-messaging-sw.js] Push payload:', payload);
    } catch (e) {
      console.log('[firebase-messaging-sw.js] Push data:', event.data.text());
    }
  }
});
