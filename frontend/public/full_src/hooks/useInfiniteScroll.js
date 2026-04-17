// Infinite Scroll Hook for paginated feed
import { useState, useEffect, useCallback, useRef } from 'react';

export const useInfiniteScroll = ({
  fetchFn,
  pageSize = 10,
  initialData = [],
  enabled = true
}) => {
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const observerRef = useRef(null);
  const loadingRef = useRef(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const skip = page * pageSize;
      const result = await fetchFn({ limit: pageSize, skip });
      const newItems = result.data || result || [];

      if (newItems.length < pageSize) {
        setHasMore(false);
      }

      setData(prev => {
        // Avoid duplicates
        const existingIds = new Set(prev.map(item => item.post_id || item.id));
        const uniqueNew = newItems.filter(item => !existingIds.has(item.post_id || item.id));
        return [...prev, ...uniqueNew];
      });
      
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err.message || 'Erreur de chargement');
      console.error('Infinite scroll error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, loading, hasMore, fetchFn, enabled]);

  // Reset function
  const reset = useCallback(() => {
    setData([]);
    setPage(0);
    setHasMore(true);
    setError(null);
  }, []);

  // Refresh function (reload from start)
  const refresh = useCallback(async () => {
    reset();
    // Wait for state to update
    await new Promise(resolve => setTimeout(resolve, 0));
    await loadMore();
  }, [reset, loadMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: '200px', threshold: 0 }
    );

    observerRef.current = observer;

    return () => observer.disconnect();
  }, [loadMore, hasMore, loading, enabled]);

  // Observe loading element
  const setLoadingElement = useCallback((element) => {
    if (loadingRef.current) {
      observerRef.current?.unobserve(loadingRef.current);
    }
    
    if (element) {
      loadingRef.current = element;
      observerRef.current?.observe(element);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (enabled && data.length === 0) {
      loadMore();
    }
  }, [enabled]); // eslint-disable-line

  return {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
    refresh,
    setLoadingElement,
    setData
  };
};

// Pull to Refresh Hook
export const usePullToRefresh = (onRefresh, { threshold = 80 } = {}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    setPullDistance(Math.min(distance, threshold * 1.5));
  }, [isPulling, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current || document;
    
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    isPulling,
    pullDistance,
    isRefreshing,
    pullProgress: Math.min(pullDistance / threshold, 1)
  };
};

// Offline Cache Hook
export const useOfflineCache = (key, fetchFn, { ttl = 5 * 60 * 1000 } = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isCached, setIsCached] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadData = useCallback(async (forceRefresh = false) => {
    const cacheKey = `fenua_cache_${key}`;
    
    // Try to get from cache
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > ttl;
        
        if (!isExpired || isOffline) {
          setData(cachedData);
          setIsCached(true);
          setLoading(false);
          
          if (!forceRefresh && !isExpired) return;
        }
      }
    } catch (e) {
      console.error('Cache read error:', e);
    }

    // Fetch fresh data if online
    if (!isOffline) {
      try {
        setLoading(true);
        const result = await fetchFn();
        const freshData = result.data || result;
        
        setData(freshData);
        setIsCached(false);
        
        // Save to cache
        localStorage.setItem(cacheKey, JSON.stringify({
          data: freshData,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error('Fetch error:', err);
        // Keep showing cached data on error
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [key, fetchFn, ttl, isOffline]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = () => loadData(true);
  
  const clearCache = () => {
    localStorage.removeItem(`fenua_cache_${key}`);
    setData(null);
    setIsCached(false);
  };

  return {
    data,
    loading,
    isOffline,
    isCached,
    refresh,
    clearCache
  };
};

export default useInfiniteScroll;
