import {
  DexSearchContainer,
  DexSearchProvider,
} from '@pokehub/frontend/pokehub-dex-components';

export default function PokedexPage() {
  return (
    <DexSearchProvider>
      <div className="min-h-screen bg-background pb-16 pt-20">
        <div className="mx-auto max-w-7xl px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold">Pokédex</h1>
            <p className="mt-2 text-muted-foreground">
              Explore and discover all Pokémon with detailed information
            </p>
          </div>
          {/* Main Content */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
            <DexSearchContainer />
          </div>
        </div>
      </div>
    </DexSearchProvider>
  );
}
