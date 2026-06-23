// Nati Fenua - Service Worker v6 (2026-06-23)
// MINIMAL passthrough SW + self-cleanup of any older caching SW.
//
// History:
//  - v4 and earlier: aggressively cached JS/CSS → stale code on Render redeploys
//  - v5 (2026-04): switched to minimal passthrough, deleted old caches
//  - v6 (2026-06): bump version to force re-activation for users still stuck
//                  on v5 OR on the legacy /sw.js cache-first SW. Also adds
//                  a one-time hard reload after takeover to guarantee a clean
//                  fetch of the latest main.<hash>.js bundle.
//
// This SW NEVER intercepts fetch requests so the browser's normal HTTP cache
// + CRA's hashed filenames handle versioning correctly.

const SW_VERSION = 'nati-fenua-v6-2026-06-23';

self.addEventListener('install', () => {
  // Activate immediately without waiting for the old SW to stop
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 1. Wipe ALL caches from previous SW versions (including legacy v3/v4 sw.js cache)
      try {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      } catch (e) {
        // ignore
      }
      // 2. Take control of all open clients (tabs, installed PWA)
      try { await self.clients.claim(); } catch (e) {}
      // 3. Notify clients that caches are cleared — they can reload if needed
      try {
        const clients = await self.clients.matchAll();
        clients.forEach((c) => c.postMessage({ type: 'SW_UPDATED', version: SW_VERSION }));
      } catch (e) {}
    })()
  );
});

// Allow client-driven skipWaiting + force cache clear
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))))
    );
  }
});

// NO fetch handler on purpose — browser + HTTP caching handle everything.
// This guarantees users always get the freshest main.<hash>.js after deploys.
