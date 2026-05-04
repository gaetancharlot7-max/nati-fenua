import { useEffect, useState, useRef, useCallback } from 'react';
import { swrFetch, cacheInvalidate } from '../lib/swrCache';

/**
 * useSwrQuery — stale-while-revalidate hook.
 *
 * Returns { data, loading, isStale, refetch }.
 *  - On first mount: returns cached value instantly (loading=false) if available,
 *    while a background fetch refreshes the data.
 *  - On subsequent navigations to the same page, the data is shown instantly.
 *
 * @param {string|null} key - cache key (null disables the query)
 * @param {() => Promise<any>} fetcher - async function returning data
 * @param {{ ttl?: number, enabled?: boolean }} opts
 */
export const useSwrQuery = (key, fetcher, opts = {}) => {
  const enabled = opts.enabled !== false && !!key;
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [isStale, setIsStale] = useState(false);

  const run = useCallback(async (force = false) => {
    if (!enabled) return;
    setLoading(true);
    let firstCall = true;
    await swrFetch(
      key,
      () => fetcherRef.current(),
      (d, stale) => {
        setData(d);
        setIsStale(stale);
        // First sync call (cached) → stop loading immediately
        if (firstCall) {
          setLoading(false);
          firstCall = false;
        }
      },
      { ttl: opts.ttl, force }
    ).catch(() => {
      // On error, leave cached value (if any) and stop loading
    }).finally(() => {
      setLoading(false);
    });
  }, [key, enabled, opts.ttl]);

  useEffect(() => {
    run();
  }, [run]);

  const refetch = useCallback(() => run(true), [run]);

  return { data, loading, isStale, refetch };
};

export const invalidateSwr = cacheInvalidate;
