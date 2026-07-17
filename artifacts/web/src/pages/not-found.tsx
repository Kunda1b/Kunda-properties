import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-6xl mb-6">🏚️</p>
        <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-gray-500 mb-8">This page couldn't be found.</p>
        <Link href="/" className="btn-primary inline-flex">Back to Home</Link>
      </div>
    </div>
  );
}
