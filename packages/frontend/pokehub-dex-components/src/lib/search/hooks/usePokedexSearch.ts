import {
  Dex,
  type Species,
  type GenerationNum,
  type ModdedDex,
  type TypeName,
} from '@pkmn/dex';
import { useQuery } from '@tanstack/react-query';

export interface PokedexSearchOptions {
  types: TypeName[];
  generations: GenerationNum[];
  searchTerm: string;
}

export const usePokedexSearch = (searchOptions: PokedexSearchOptions) => {
  const { types, generations, searchTerm } = searchOptions;

  return useQuery({
    queryKey: ['pokedex-search', searchOptions],
    queryFn: () => {
      const moddedDexes: ModdedDex[] = [];
      const result: Species[] = [];

      if (generations.length === 0) {
        moddedDexes.push(Dex);
      } else {
        generations.forEach((gen) => {
          const moddedDex = Dex.forGen(gen);
          if (moddedDex) {
            moddedDexes.push(moddedDex);
          }
        });
      }

      let prevSpecies = '';

      moddedDexes.forEach((moddedDex) => {
        moddedDex.species
          .all()
          .filter((s) =>
            generations.length > 0 ? s.gen === moddedDex.gen : true
          )
          .forEach((species) => {
            if (prevSpecies !== species.baseSpecies && species.num > 0) {
              const isTypeMatch =
                types.length > 0
                  ? species.types.some((type) => types.includes(type))
                  : true;
              const isNameMatch = searchTerm
                ? species.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  species.num.toString().includes(searchTerm)
                : true;
              if (isTypeMatch && isNameMatch) {
                result.push(species);
              }
            }
            prevSpecies = species.baseSpecies;
          });
      });

      return result;
    },
  });
};
