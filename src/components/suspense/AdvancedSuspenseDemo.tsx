'use client';

import { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { SuspenseWrapper } from './SuspenseWrapper';
import { useSuspenseQuery } from '@/hooks/useSuspenseQuery';
import { CompactLoadingFallback, SkeletonCard } from './LoadingFallbacks';

// Simulated data fetching with different behaviors
const fetchWithDelay = (ms: number, shouldFail = false) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error(`Failed after ${ms}ms`));
      } else {
        resolve(`Data loaded after ${ms}ms`);
      }
    }, ms);
  });

function FastComponent() {
  const data = useSuspenseQuery(['fast'], () => fetchWithDelay(500));
  return <div className="p-4 bg-green-100 rounded">Fast: {String(data)}</div>;
}

function SlowComponent() {
  const data = useSuspenseQuery(['slow'], () => fetchWithDelay(2000));
  return <div className="p-4 bg-blue-100 rounded">Slow: {String(data)}</div>;
}

function FailingComponent() {
  useSuspenseQuery(['failing'], () => fetchWithDelay(1000, true));
  return <div className="p-4 bg-red-100 rounded">This won&apos;t show</div>;
}

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded">
      <h3 className="font-semibold text-red-800">Component Error</h3>
      <p className="text-red-600 text-sm">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  );
}

export function AdvancedSuspenseDemo() {
  const [showComponents, setShowComponents] = useState<Record<string, boolean>>({
    fast: true,
    slow: true,
    failing: true,
  });

  const toggleComponent = (key: string) => {
    setShowComponents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Advanced Suspense Demo</h1>
        <p className="text-gray-600 mb-6">
          This demonstrates progressive loading, error boundaries, and independent component states.
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-4 justify-center">
        {Object.entries(showComponents).map(([key, enabled]) => (
          <button
            key={key}
            onClick={() => toggleComponent(key)}
            className={`px-4 py-2 rounded ${
              enabled ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {enabled ? 'Hide' : 'Show'} {key}
          </button>
        ))}
      </div>

      {/* Progressive Loading Demo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Fast Loading Component */}
        {showComponents.fast && (
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Fast Component (500ms)</h3>
            <SuspenseWrapper fallback={<CompactLoadingFallback />}>
              <FastComponent />
            </SuspenseWrapper>
          </div>
        )}

        {/* Slow Loading Component */}
        {showComponents.slow && (
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Slow Component (2s)</h3>
            <SuspenseWrapper fallback={<SkeletonCard />}>
              <SlowComponent />
            </SuspenseWrapper>
          </div>
        )}

        {/* Error Prone Component */}
        {showComponents.failing && (
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Failing Component</h3>
            <ErrorBoundary
              FallbackComponent={ErrorFallback}
              onError={(error) => console.error('Component failed:', error)}
            >
              <SuspenseWrapper fallback={<CompactLoadingFallback />}>
                <FailingComponent />
              </SuspenseWrapper>
            </ErrorBoundary>
          </div>
        )}
      </div>

      {/* Nested Suspense Example */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Nested Suspense (Independent Loading)</h3>
        <SuspenseWrapper
          fallback={
            <div className="space-y-4">
              <SkeletonCard />
              <div className="text-center text-gray-500">Loading outer content...</div>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-4 bg-gray-100 rounded">
              <p>This content loads first (outer Suspense boundary)</p>
            </div>

            <SuspenseWrapper
              fallback={
                <div className="p-4 bg-yellow-100 rounded animate-pulse">
                  Loading inner content...
                </div>
              }
            >
              <SlowComponent />
            </SuspenseWrapper>
          </div>
        </SuspenseWrapper>
      </div>

      {/* Error Boundary with Reset */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Error Recovery Demo</h3>
        <ErrorBoundary
          FallbackComponent={({ error, resetErrorBoundary }) => (
            <div className="p-6 bg-red-50 border border-red-200 rounded text-center">
              <h4 className="font-semibold text-red-800 mb-2">Oops! Something went wrong</h4>
              <p className="text-red-600 mb-4">{error.message}</p>
              <div className="space-x-2">
                <button
                  onClick={resetErrorBoundary}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          )}
          onError={(error, errorInfo) => {
            // Log to monitoring service
            console.error('Error caught by boundary:', { error, errorInfo });
          }}
        >
          <SuspenseWrapper fallback={<CompactLoadingFallback />}>
            <FailingComponent />
          </SuspenseWrapper>
        </ErrorBoundary>
      </div>
    </div>
  );
}
