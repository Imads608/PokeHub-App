import { Species } from '@pkmn/dex';
import { Button } from '@pokehub/frontend/shared-ui-components';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface NavigationPanelProps {
  pokemonDetails: Species;
  pokedexByID?: { [id: number]: Species };
}

export const NavigationPanel = ({
  pokemonDetails,
  pokedexByID,
}: NavigationPanelProps) => {
  const router = useRouter();

  const navigateToPokemon = (newId: string) => {
    router.push(`/pokedex/${newId}`);
  };
  return (
    <div className="mb-6 flex items-center justify-between">
      <Button variant="ghost" asChild>
        <Link href="/pokedex">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Pokédex
        </Link>
      </Button>
      <div className="flex items-center gap-2">
        {pokemonDetails.num > 1 &&
          pokedexByID &&
          pokedexByID[pokemonDetails.num - 1] && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigateToPokemon(pokedexByID[pokemonDetails.num - 1].id)
              }
            >
              <ChevronLeft className="mr-1 h-4 w-4" />#
              {(pokemonDetails.num - 1).toString().padStart(3, '0')}
            </Button>
          )}
        {pokedexByID && pokedexByID[pokemonDetails.num + 1] && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigateToPokemon(pokedexByID[pokemonDetails.num + 1].id)
            }
          >
            #{(pokemonDetails.num + 1).toString().padStart(3, '0')}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
