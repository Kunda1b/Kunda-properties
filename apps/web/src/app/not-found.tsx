import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
      <span className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-kunda-muted">
        Not found
      </span>
      <h1 className="mb-3 font-display text-3xl font-semibold text-kunda-ink">
        We could not find that page
      </h1>
      <p className="mb-8 max-w-md text-sm text-kunda-muted">
        The listing or route may have moved while the frontend was being
        scaffolded. Head back to the listings index to continue browsing.
      </p>
      <Link href="/listings" className="btn-primary">
        Back to listings
      </Link>
    </div>
  );
}
