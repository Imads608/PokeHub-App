import { type Species, Dex } from '@pkmn/dex';
import { useQuery } from '@tanstack/react-query';

export const usePokedexByID = () => {
  return useQuery({
    queryKey: ['pokedex-search', { type: 'PokedexByID', provider: 'PkmnDex' }],
    queryFn: () => {
      const results: { [id: number]: Species } = {};

      let prevNum = 0;
      Dex.species.all().forEach((species) => {
        if (prevNum !== species.num) {
          results[species.num] = species;
        }
        prevNum = species.num;
      });
      return results;
    },
  });
};
