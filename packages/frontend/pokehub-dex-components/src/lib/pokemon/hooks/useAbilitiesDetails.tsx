import type { ModdedDex } from '@pkmn/dex';
import { Dex } from '@pkmn/dex';
import { useQuery } from '@tanstack/react-query';

export interface AbilitiesDetailsOptions {
  generation?: number;
}

export const useAbiltiesDetails = (
  abilities: string[],
  options: AbilitiesDetailsOptions = { generation: 9 }
) => {
  return useQuery({
    queryKey: [
      'pokedex-search',
      abilities,
      { type: 'Abilities', provider: 'PkmnDex', ...options },
    ],
    queryFn: () => {
      const { generation } = options;
      let moddedDex: ModdedDex;

      if (generation) {
        moddedDex = Dex.forGen(generation);
      } else {
        moddedDex = Dex;
      }

      const abilitiesDetails = abilities.map((ability) => {
        const abilityData = moddedDex.abilities.get(ability);
        if (!abilityData.exists) {
          return undefined;
        }
        return abilityData;
      });

      return abilitiesDetails;
    },
    enabled: abilities.length > 0,
  });
};
