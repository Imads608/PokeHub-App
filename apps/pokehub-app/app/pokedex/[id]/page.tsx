'use client';

import type { ID } from '@pkmn/dex';
import { usePokemonDetails } from '@pokehub/frontend/dex-data-provider';
import {
  PokemonDetailsContainer,
  PokemonDexDetailsProvider,
} from '@pokehub/frontend/pokehub-dex-components';
import { Button } from '@pokehub/frontend/shared-ui-components';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function PokemonPage() {
  const params = useParams();

  const id = params.id as ID;

  const { data: pokemonDetails, isLoading: isPokemonDetailsLoading } =
    usePokemonDetails(id, { generation: 9 });

  if (isPokemonDetailsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background pt-20">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p>Loading Pokémon data...</p>
        </div>
      </div>
    );
  } else if (!pokemonDetails) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background pt-20">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold">Pokémon Not Found</h2>
          <p className="mb-6 text-muted-foreground">
            {"The Pokémon you're looking for doesn't exist or has fled"}.
          </p>
          <Button asChild>
            <Link href="/pokedex">Return to Pokédex</Link>
          </Button>
        </div>
      </div>
    );
  }
  return (
    <PokemonDexDetailsProvider id={id}>
      <PokemonDetailsContainer />
    </PokemonDexDetailsProvider>
  );
}
