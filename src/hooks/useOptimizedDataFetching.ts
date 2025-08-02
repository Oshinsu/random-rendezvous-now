import { useCallback, useRef } from 'react';

export const useOptimizedDataFetching = () => {
  const lastFetchRef = useRef<number>(0);
  const pendingFetchRef = useRef<Promise<any> | null>(null);

  const debouncedFetch = useCallback(async (
    fetchFunction: () => Promise<any>,
    minInterval: number = 1000
  ) => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;

    // If there's already a pending fetch, return it
    if (pendingFetchRef.current) {
      return pendingFetchRef.current;
    }

    // If we've fetched recently, don't fetch again
    if (timeSinceLastFetch < minInterval) {
      return Promise.resolve(null);
    }

    // Create and track the new fetch
    lastFetchRef.current = now;
    pendingFetchRef.current = fetchFunction().finally(() => {
      pendingFetchRef.current = null;
    });

    return pendingFetchRef.current;
  }, []);

  const resetCache = useCallback(() => {
    lastFetchRef.current = 0;
    pendingFetchRef.current = null;
  }, []);

  return { debouncedFetch, resetCache };
};