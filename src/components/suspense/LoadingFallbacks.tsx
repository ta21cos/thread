export function DashboardLoadingFallback() {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-base-content/60">Loading dashboard...</p>
        </div>
      </div>
    </div>
  );
}

export function MessageListLoadingFallback() {
  return (
    <div className="space-y-4 p-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="flex space-x-3">
            <div className="rounded-full bg-gray-300 h-8 w-8"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ThreadLoadingFallback() {
  return (
    <div className="space-y-3 p-4">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-1/3 mb-3"></div>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex space-x-3 mb-3">
            <div className="rounded-full bg-gray-300 h-6 w-6"></div>
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-gray-300 rounded w-1/5"></div>
              <div className="h-3 bg-gray-300 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AuthLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600">Loading authentication...</p>
      </div>
    </div>
  );
}

export function CompactLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-4">
      <span className="loading loading-dots loading-md"></span>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="rounded-full bg-gray-300 h-10 w-10"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/6"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-300 rounded w-full"></div>
        <div className="h-4 bg-gray-300 rounded w-5/6"></div>
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      </div>
    </div>
  );
}
