'use client';

// Empty import to satisfy linting

type QueryFunction<T> = () => Promise<T>;
type QueryKey = string | readonly unknown[];

interface QueryState<T> {
  data?: T;
  error?: Error;
  promise?: Promise<T>;
}

const queryCache = new Map<string, QueryState<unknown>>();

function getQueryKey(key: QueryKey): string {
  return typeof key === 'string' ? key : JSON.stringify(key);
}

export function useSuspenseQuery<T>(
  queryKey: QueryKey,
  queryFn: QueryFunction<T>,
  options?: {
    staleTime?: number;
    cacheTime?: number;
  }
): T {
  const cacheKey = getQueryKey(queryKey);
  const { cacheTime = 10 * 60 * 1000 } = options || {};

  let queryState = queryCache.get(cacheKey);

  if (!queryState) {
    queryState = { promise: undefined, data: undefined, error: undefined };
    queryCache.set(cacheKey, queryState);
  }

  if (queryState.error) {
    throw queryState.error;
  }

  if (queryState.data) {
    return queryState.data as T;
  }

  if (!queryState.promise) {
    queryState.promise = queryFn()
      .then((data) => {
        queryState!.data = data;
        queryState!.promise = undefined;

        // Set up cache expiry
        setTimeout(() => {
          queryCache.delete(cacheKey);
        }, cacheTime);

        return data;
      })
      .catch((error) => {
        queryState!.error = error;
        queryState!.promise = undefined;
        throw error;
      });
  }

  throw queryState.promise;
}

export function invalidateQuery(queryKey: QueryKey) {
  const cacheKey = getQueryKey(queryKey);
  queryCache.delete(cacheKey);
}

export function prefetchQuery<T>(queryKey: QueryKey, queryFn: QueryFunction<T>) {
  const cacheKey = getQueryKey(queryKey);

  if (!queryCache.has(cacheKey)) {
    const queryState: QueryState<T> = { promise: undefined, data: undefined, error: undefined };
    queryState.promise = queryFn()
      .then((data) => {
        queryState.data = data;
        queryState.promise = undefined;
        return data;
      })
      .catch((error) => {
        queryState.error = error;
        queryState.promise = undefined;
        throw error;
      });

    queryCache.set(cacheKey, queryState);
  }
}
