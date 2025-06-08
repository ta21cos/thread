'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { memoryCache } from '@/lib/cache/memory-cache';

type QueryFunction<T> = () => Promise<T>;
type QueryKey = string | readonly unknown[];

interface QueryOptions {
  staleTime?: number;
  cacheTime?: number;
  enabled?: boolean;
}

interface QueryState<T> {
  data?: T;
  error?: Error;
  isLoading: boolean;
  isFetching: boolean;
}

function getQueryKey(key: QueryKey): string {
  return typeof key === 'string' ? key : JSON.stringify(key);
}

export function useStableQuery<T>(
  queryKey: QueryKey,
  queryFn: QueryFunction<T>,
  options: QueryOptions = {}
): QueryState<T> & { refetch: () => Promise<void> } {
  const {
    cacheTime = 10 * 60 * 1000, // 10 minutes
    enabled = true,
  } = options;

  const cacheKey = getQueryKey(queryKey);
  const [state, setState] = useState<QueryState<T>>({
    data: memoryCache.get(cacheKey) as T | undefined,
    error: undefined,
    isLoading: !memoryCache.get(cacheKey),
    isFetching: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState((prev) => ({ ...prev, isFetching: true, error: undefined }));

    try {
      const data = await queryFn();

      // Check if the request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Cache the result
      memoryCache.set(cacheKey, data, cacheTime);

      setState({
        data,
        error: undefined,
        isLoading: false,
        isFetching: false,
      });
    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Unknown error'),
        isLoading: false,
        isFetching: false,
      }));
    }
  }, [queryFn, cacheKey, cacheTime]);

  const refetch = async () => {
    // Clear cache for this key
    memoryCache.invalidate(cacheKey);
    await fetchData();
  };

  useEffect(() => {
    if (!enabled) return;

    // Check if we have fresh data in cache
    const cachedData = memoryCache.get(cacheKey) as T | null;
    if (cachedData) {
      setState((prev) => ({
        ...prev,
        data: cachedData,
        isLoading: false,
      }));
      return;
    }

    // Fetch data if not in cache or cache is stale
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [cacheKey, enabled, fetchData]);

  return {
    ...state,
    refetch,
  };
}

export function invalidateQuery(queryKey: QueryKey) {
  const cacheKey = getQueryKey(queryKey);
  memoryCache.invalidate(cacheKey);
}

export function invalidateQueries(pattern: string) {
  memoryCache.invalidatePattern(pattern);
}
