// Nati Fenua - Service Worker for Offline Mode
const CACHE_NAME = 'nati-fenua-v2';
const STATIC_CACHE = 'nati-static-v2';
const DATA_CACHE = 'nati-data-v2';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icons/nati-fenua-192.png',
  '/icons/nati-fenua-512.png',
  '/offline.html'
];

// API routes to cache
const API_ROUTES_TO_CACHE = [
  '/api/posts',
  '/api/users/me',
  '/api/stories',
  '/api/marketplace/products',
  '/api/marketplace/services'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.log('[SW] Cache error:', err))
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DATA_CACHE && name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome extensions and other protocols
  if (!url.protocol.startsWith('http')) return;

  // Handle API requests - Network first, then cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle static assets - Cache first, then network
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Handle page navigations - Network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request));
    return;
  }

  // Default - Network first
  event.respondWith(networkFirstStrategy(request));
});

// Check if URL is a static asset
function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Cache First Strategy - for static assets
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Return cached version and update cache in background
    fetchAndCache(request, STATIC_CACHE);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network First Strategy - for API and dynamic content
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful API responses
    if (networkResponse.ok && request.url.includes('/api/')) {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add offline header to indicate cached data
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-From-Cache', 'true');
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        headers: headers
      });
    }
    
    // Return offline response for API
    if (request.url.includes('/api/')) {
      return new Response(JSON.stringify({ 
        error: 'offline',
        message: 'Vous etes hors ligne. Les donnees affichees peuvent etre obsoletes.',
        cached: false
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Navigation Strategy - for page requests
async function navigationStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation offline, serving cached page');
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    
    // Serve offline page
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) return offlinePage;
    
    // Fallback to index for SPA
    const indexPage = await caches.match('/index.html');
    if (indexPage) return indexPage;
    
    return new Response('Offline', { status: 503 });
  }
}

// Background fetch and cache update
async function fetchAndCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    // Silently fail background updates
  }
}

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_URLS') {
    cacheUrls(event.data.urls);
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    clearAllCaches();
  }
});

// Cache specific URLs on demand
async function cacheUrls(urls) {
  const cache = await caches.open(DATA_CACHE);
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        cache.put(url, response);
      }
    } catch (error) {
      console.log('[SW] Failed to cache:', url);
    }
  }
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Sync important data in background
  const urlsToSync = [
    '/api/posts?limit=20',
    '/api/users/me',
    '/api/notifications'
  ];
  
  await cacheUrls(urlsToSync);
}

console.log('[SW] Service Worker loaded - Nati Fenua Offline Mode');
