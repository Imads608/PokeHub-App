import { usePokemonDexDetailsContext } from '../../context/pokemon-dex-details.context';
import type { Species } from '@pkmn/dex';
import { PokemonTypeBadge } from '@pokehub/frontend/pokehub-ui-components';
import { Button } from '@pokehub/frontend/shared-ui-components';
import { useRouter } from 'next/navigation';
import type { Pokemon } from 'pokeapi-js-wrapper';

// Individual Pokémon card component
export function PokemonCard({
  pokemon,
  pokeAPI,
}: {
  pokemon: Species;
  pokeAPI: Pokemon;
}) {
  const {
    selectedForm: { pokemon: selectedPokemon, pokemonPokeAPI: selectedPokeAPI },
    resetOnSpeciesNav,
  } = usePokemonDexDetailsContext();

  const router = useRouter();

  const onSelectPokemon = () => {
    selectedPokemon.setValue(pokemon);
    selectedPokeAPI.setValue(pokeAPI);
    if (pokemon.num !== selectedPokemon.value?.num) {
      resetOnSpeciesNav();
      router.push(`/pokedex/${pokemon.id}`);
    }
  };

  return (
    <Button
      variant="ghost"
      className="group h-auto p-0 hover:bg-transparent"
      onClick={onSelectPokemon}
    >
      <div className="flex flex-col items-center">
        <div
          className={`mb-2 rounded-full p-3 transition-colors ${
            selectedPokemon.value?.id === pokemon.id
              ? 'bg-primary/10'
              : 'bg-muted group-hover:bg-muted/80'
          }`}
        >
          <img
            src={
              pokeAPI.sprites.other['official-artwork'].front_default ||
              '/placeholder.svg'
            }
            alt={pokemon.name}
            className="h-16 w-16 object-contain transition-transform group-hover:scale-110 sm:h-20 sm:w-20"
          />
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            #{pokemon.num.toString().padStart(3, '0')}
          </p>
          <p
            className={`font-medium ${
              selectedPokemon.value?.id === pokemon.id ? 'text-primary' : ''
            }`}
          >
            {pokemon.name}
          </p>
          <div className="mt-1 flex justify-center gap-1">
            {pokemon.types?.map((type) => (
              <PokemonTypeBadge pokemonType={type} />
            ))}
          </div>
        </div>
      </div>
    </Button>
  );
}
