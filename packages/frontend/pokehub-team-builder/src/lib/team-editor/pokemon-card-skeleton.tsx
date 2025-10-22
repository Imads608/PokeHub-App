export const PokemonCardSkeleton = () => {
  return (
    <div className="flex flex-col items-center rounded-lg border p-2 animate-pulse">
      <div className="mb-2 h-4 w-12 bg-muted rounded"></div>
      <div className="h-24 w-24 bg-muted rounded"></div>
      <div className="mt-2 h-4 w-20 bg-muted rounded"></div>
      <div className="mt-1 flex gap-1">
        <div className="h-5 w-12 bg-muted rounded-full"></div>
        <div className="h-5 w-12 bg-muted rounded-full"></div>
      </div>
    </div>
  );
};
