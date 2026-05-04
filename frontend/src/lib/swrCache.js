// Lightweight in-memory cache with stale-while-revalidate pattern.
// Goal: make page navigation feel instantaneous by serving cached data
// immediately, then quietly refreshing in the background.

const cache = new Map(); // key -> { data, t }
const inflight = new Map(); // key -> Promise (dedup concurrent requests)

const DEFAULT_TTL = 30_000; // 30 seconds before background refresh
const MAX_AGE = 5 * 60_000; // 5 minutes hard expiry

export const cacheGet = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.t > MAX_AGE) {
    cache.delete(key);
    return null;
  }
  return entry;
};

export const cacheSet = (key, data) => {
  cache.set(key, { data, t: Date.now() });
};

export const cacheInvalidate = (prefix) => {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const k of cache.keys()) {
    if (k.startsWith(prefix)) cache.delete(k);
  }
};

/**
 * Stale-while-revalidate fetcher.
 * Calls onData(data, isStale) potentially twice:
 *   1. Synchronously with cached data (isStale=true) if available.
 *   2. With fresh data (isStale=false) once network completes.
 *
 * @param {string} key - cache key
 * @param {() => Promise<any>} fetcher - returns fresh data
 * @param {(data, isStale) => void} onData - called with payload
 * @param {{ ttl?: number, force?: boolean }} opts
 */
export const swrFetch = (key, fetcher, onData, opts = {}) => {
  const ttl = opts.ttl ?? DEFAULT_TTL;
  const entry = cacheGet(key);
  const fresh = entry && Date.now() - entry.t < ttl;

  // 1. Serve stale immediately (if any)
  if (entry) onData(entry.data, !fresh);

  // 2. Skip network if data is still fresh and not forced
  if (fresh && !opts.force) return Promise.resolve(entry.data);

  // 3. Dedup concurrent requests for the same key
  if (inflight.has(key)) {
    return inflight.get(key);
  }

  const promise = (async () => {
    try {
      const data = await fetcher();
      cacheSet(key, data);
      onData(data, false);
      return data;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, promise);
  return promise;
};
