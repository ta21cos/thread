import { Suspense, ReactNode, ErrorInfo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?:
    | ReactNode
    | ((props: { error: Error; resetErrorBoundary: () => void }) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-6">
      <div className="text-center">
        <span className="loading loading-spinner loading-md"></span>
        <p className="mt-2 text-sm text-base-content/60">Loading...</p>
      </div>
    </div>
  );
}

function DefaultErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="text-red-500 mb-4">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
      <p className="text-gray-600 mb-4">An error occurred while loading this content.</p>
      <button onClick={resetErrorBoundary} className="btn btn-primary btn-sm">
        Try again
      </button>
    </div>
  );
}

export function SuspenseWrapper({
  children,
  fallback,
  errorFallback,
  onError,
  onReset,
}: SuspenseWrapperProps) {
  return (
    <ErrorBoundary
      FallbackComponent={(errorFallback as any) || DefaultErrorFallback}
      onError={onError}
      onReset={onReset}
    >
      <Suspense fallback={fallback || <DefaultLoadingFallback />}>{children}</Suspense>
    </ErrorBoundary>
  );
}
