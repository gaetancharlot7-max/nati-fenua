// LEGACY service worker — kept at this URL for users who registered it before
// we migrated to /service-worker.js. This SW now self-destructs and clears all
// caches so the next page load grabs the fresh /service-worker.js.
//
// IMPORTANT: NO fetch handler — never serve stale assets.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Wipe ALL caches from previous versions
      try {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      } catch (e) { /* ignore */ }
      // Take control
      try { await self.clients.claim(); } catch (e) { /* ignore */ }
      // Unregister this legacy SW so /service-worker.js can register fresh
      try {
        await self.registration.unregister();
      } catch (e) { /* ignore */ }
      // Reload all clients so they re-register the new SW
      try {
        const clients = await self.clients.matchAll();
        clients.forEach((c) => {
          try { c.navigate(c.url); } catch (_) {}
        });
      } catch (e) { /* ignore */ }
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
