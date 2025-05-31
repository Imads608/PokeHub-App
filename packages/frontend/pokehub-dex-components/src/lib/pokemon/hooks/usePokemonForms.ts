import { Dex, type Species } from '@pkmn/dex';
import { useQuery } from '@tanstack/react-query';

export const usePokemonForms = (pokemon: Species) => {
  return useQuery({
    queryKey: [
      'pokedex-search',
      pokemon.id,
      { provider: 'PkmnDex', type: 'Forms' },
    ],
    queryFn: () => {
      const forms: Species[] = [];
      const allSpecies = Dex.species.all();

      for (const currSpecies of allSpecies) {
        if (
          currSpecies.num === pokemon.num &&
          currSpecies.baseSpecies === pokemon.baseSpecies
        ) {
          forms.push(currSpecies);
        } else if (currSpecies.num > pokemon.num) {
          break;
        }
      }

      return forms;
    },
  });
};
