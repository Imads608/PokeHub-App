import { Dex, type ID, type SpeciesName } from '@pkmn/dex';
import { useQuery } from '@tanstack/react-query';

export const usePokemonNameToIdMap = () => {
  return useQuery({
    queryKey: ['pokedex-search', { type: 'NameToIDMap', provider: 'PkmnDex' }],
    queryFn: () => {
      const results: { [name: SpeciesName]: ID } = {};

      Dex.species.all().forEach((species) => {
        results[species.name] = species.id;
      });
      return results;
    },
  });
};
