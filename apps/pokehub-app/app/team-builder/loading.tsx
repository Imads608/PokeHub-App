export default function TeamBuilderLoading() {
  return (
    <div className="min-h-screen bg-background pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header Skeleton */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-10 w-48 animate-pulse rounded-md bg-muted" />
            <div className="mt-2 h-6 w-80 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="h-10 w-44 animate-pulse rounded-md bg-muted" />
        </div>

        {/* Filters Card Skeleton */}
        <div className="mb-8 rounded-lg border bg-card shadow-sm">
          <div className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-5 w-5 animate-pulse rounded bg-muted" />
              <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Search Skeleton */}
              <div>
                <div className="mb-2 h-5 w-16 animate-pulse rounded bg-muted" />
                <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
              </div>
              {/* Generation Skeleton */}
              <div>
                <div className="mb-2 h-5 w-24 animate-pulse rounded bg-muted" />
                <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
              </div>
              {/* Format Skeleton */}
              <div>
                <div className="mb-2 h-5 w-16 animate-pulse rounded bg-muted" />
                <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
              </div>
              {/* Tier Skeleton */}
              <div>
                <div className="mb-2 h-5 w-12 animate-pulse rounded bg-muted" />
                <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
              </div>
            </div>
          </div>
        </div>

        {/* Teams Display Skeleton */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 h-16 w-16 animate-pulse rounded-full bg-muted" />
            <div className="mb-2 h-8 w-48 animate-pulse rounded-md bg-muted" />
            <div className="mb-6 h-6 w-80 animate-pulse rounded-md bg-muted" />
            <div className="h-10 w-56 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
