/**
 * Calm reading skeleton shown while the reader content loads.
 * Deliberately not a full-screen spinner — a quiet, readable placeholder.
 */
export default function ReaderLoading() {
  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl items-center px-3 py-2">
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        <div className="mx-auto h-3 w-40 animate-pulse rounded bg-muted" />
        <div className="h-6 w-16 animate-pulse rounded bg-muted" />
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="prose-reading mx-auto px-6 py-12">
          <div className="h-7 w-2/3 animate-pulse rounded bg-muted" />
          <div className="mt-8 space-y-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="h-4 animate-pulse rounded bg-muted"
                style={{ width: `${85 - (i % 5) * 8}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
