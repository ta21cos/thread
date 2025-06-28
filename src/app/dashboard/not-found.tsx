import Link from 'next/link';

export default function DashboardNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="text-6xl font-bold text-base-content/40 mb-4">404</div>
        <h2 className="text-2xl font-bold text-base-content mb-2">Dashboard Page Not Found</h2>
        <p className="text-base-content/60 mb-6">
          The dashboard page you&apos;re looking for doesn&apos;t exist.
        </p>
        <div className="space-y-3">
          <Link href="/dashboard" className="btn btn-primary w-full">
            Go to main dashboard
          </Link>
          <Link href="/" className="btn btn-secondary w-full">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
