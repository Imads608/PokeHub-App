export default function TeamEditLoading() {
  return (
    <div className="min-h-screen bg-background pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-10 w-48 animate-pulse rounded-md bg-muted" />
          <div className="mt-2 h-6 w-80 animate-pulse rounded-md bg-muted" />
        </div>

        {/* Team Configuration Card */}
        <div className="mb-8 grid gap-6 md:grid-cols-[1fr_auto]">
          {/* Main Configuration Card Skeleton */}
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="p-6 pb-4">
              {/* Header with buttons */}
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-1 h-6 w-48 animate-pulse rounded-md bg-muted" />
                  <div className="h-5 w-64 animate-pulse rounded-md bg-muted" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
                  <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
                  <div className="h-8 w-28 animate-pulse rounded-md bg-muted" />
                </div>
              </div>

              {/* Form Fields Grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i}>
                    <div className="mb-2 h-4 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
                  </div>
                ))}
              </div>

              {/* Alert Boxes */}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg border bg-muted/50 p-4"
                  >
                    <div className="mb-2 h-5 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Team Analysis Card Skeleton */}
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="p-6 pb-4">
              <div className="mb-1 h-6 w-32 animate-pulse rounded-md bg-muted" />
              <div className="mb-4 h-5 w-48 animate-pulse rounded-md bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
            </div>
          </div>
        </div>

        {/* Pokemon Team Slots Skeleton (commented out in actual component but showing skeleton) */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg border bg-card p-4 shadow-sm"
            >
              {/* Slot number */}
              <div className="mb-3 h-5 w-16 animate-pulse rounded bg-muted" />

              {/* Pokemon sprite placeholder */}
              <div className="mb-3 flex justify-center">
                <div className="h-24 w-24 animate-pulse rounded-lg bg-muted" />
              </div>

              {/* Pokemon name */}
              <div className="mb-3 h-6 w-3/4 animate-pulse rounded-md bg-muted" />

              {/* Stats/Details */}
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
              </div>

              {/* Action button */}
              <div className="mt-4 h-9 w-full animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
