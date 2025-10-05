export const MovesSkeletonLoading = () => {
  return (
    // Loading skeleton component for moves
    <div className="mt-4 space-y-4">
      {/* Tab skeleton */}
      <div className="flex space-x-1 rounded-lg bg-muted p-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-8 w-24 animate-pulse rounded-md bg-background"
          ></div>
        ))}
      </div>

      {/* Table header skeleton */}
      <div className="space-y-2">
        <div className="flex space-x-4 border-b pb-2">
          <div className="h-4 w-16 animate-pulse rounded bg-muted"></div>
          <div className="h-4 w-12 animate-pulse rounded bg-muted"></div>
          <div className="h-4 w-12 animate-pulse rounded bg-muted"></div>
          <div className="h-4 w-12 animate-pulse rounded bg-muted"></div>
          <div className="h-4 w-12 animate-pulse rounded bg-muted"></div>
          <div className="h-4 w-8 animate-pulse rounded bg-muted"></div>
        </div>

        {/* Table rows skeleton */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 border-b py-2">
            <div className="h-4 w-20 animate-pulse rounded bg-muted"></div>
            <div className="h-6 w-16 animate-pulse rounded-full bg-muted"></div>
            <div className="h-6 w-20 animate-pulse rounded bg-muted"></div>
            <div className="h-4 w-8 animate-pulse rounded bg-muted"></div>
            <div className="h-4 w-8 animate-pulse rounded bg-muted"></div>
            <div className="h-4 w-6 animate-pulse rounded bg-muted"></div>
          </div>
        ))}
      </div>

      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    </div>
  );
};
