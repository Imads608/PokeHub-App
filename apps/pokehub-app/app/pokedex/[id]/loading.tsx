export default function LoadingPokemonPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background pt-20">
      <div className="text-center">
        <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p>Loading Pokémon data...</p>
      </div>
    </div>
  );
}
