// Nati Fenua - Service Worker v5
// MINIMAL passthrough SW to fix iOS Safari stale-cache issues.
// v5 bump (2026-04-28): force re-activation to deliver the
// notifications dropdown rewrite on iPhone PWA installs which
// were still serving the v4 cached bundle.
// Previous versions aggressively cached JS/CSS assets which caused
// users (especially on iPhone Safari / installed PWAs) to keep
// loading an old broken bundle even after a fresh Render deploy.
//
// This version:
//   1. Deletes ALL old caches on activation
//   2. Does NOT intercept any fetch — lets the browser / CDN / HTTP
//      cache-control headers handle caching normally (which is what
//      Create React App and Render already do correctly via hashed
//      filenames like main.abc1234.js).
//   3. Still registers so the app is PWA-installable and push
//      notifications keep working via firebase-messaging-sw.js.
//
// If we later want offline support we can re-introduce a scoped
// cache strategy — but ONLY for known-safe static assets, never for
// HTML and never for the main JS bundle.

const CACHE_NAME = 'nati-fenua-v5';

self.addEventListener('install', () => {
  // Activate immediately without waiting for the old SW to stop
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 1. Wipe ALL caches from previous SW versions
      try {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      } catch (e) {
        // ignore
      }
      // 2. Take control of all open clients (tabs, installed PWA)
      try { await self.clients.claim(); } catch (e) {}
    })()
  );
});

// Allow client-driven skipWaiting for immediate update propagation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// NO fetch handler on purpose — browser + HTTP caching handle everything.
// This guarantees users always get the freshest main.<hash>.js after deploys.
