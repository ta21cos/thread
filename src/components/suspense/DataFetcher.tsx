'use client';

import { ReactNode, useState, useEffect } from 'react';

interface DataFetcherProps<T> {
  fetchFn: () => Promise<T>;
  children: (data: T) => ReactNode;
  deps?: unknown[];
}

export function DataFetcher<T>({ fetchFn, children, deps = [] }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await fetchFn();
        if (!isCancelled) {
          setData(result);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [fetchFn, ...deps]);

  if (isLoading || !data) {
    throw new Promise(() => {}); // Suspend
  }

  return <>{children(data)}</>;
}

export function AsyncDataFetcher<T>({ fetchFn }: Omit<DataFetcherProps<T>, 'deps'>) {
  const [promise] = useState(() => fetchFn());

  // This will throw the promise to Suspense
  throw promise.then((data) => ({ data }));
}
