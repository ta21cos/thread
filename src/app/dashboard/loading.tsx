export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="text-center">
        <span className="loading loading-spinner loading-lg"></span>
        <p className="mt-4 text-base-content/60">Loading dashboard...</p>
      </div>
    </div>
  );
}
