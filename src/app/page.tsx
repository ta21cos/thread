import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Thread</h1>
          <div className="flex space-x-4">
            <Link href="/login" className="btn btn-primary">
              Login
            </Link>
            <Link href="/signup" className="btn btn-outline">
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Welcome to Thread</h2>
            <p className="mb-4">
              A simple memo application where you can post notes and create threaded discussions.
            </p>
            <p>Please sign in to start posting memos and joining conversations.</p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Features</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Post memos similar to Slack</li>
              <li>Create threaded discussions</li>
              <li>Upload images</li>
              <li>Secure authentication</li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="bg-white shadow mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Thread App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
