import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-5xl mb-4">🏚️</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">404 – Not Found</h1>
        <Link href="/" className="btn-primary inline-flex mt-4">Back to Dashboard</Link>
      </div>
    </div>
  );
}
