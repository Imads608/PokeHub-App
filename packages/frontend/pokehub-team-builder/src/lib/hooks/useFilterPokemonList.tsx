import type { GenerationNum, Species, TypeName } from '@pkmn/dex';
import { useQuery } from '@tanstack/react-query';

export interface FilterPokemonListOptions {
  searchTerm?: string;
  types: TypeName[];
  generation: GenerationNum;
  format: string;
}

export const useFilterPokemonList = (
  data: Species[],
  { searchTerm, types, generation, format }: FilterPokemonListOptions
) => {
  return useQuery({
    queryKey: [
      'pokedex-competitive-search',
      { generation, format },
      { searchTerm, types },
    ],
    queryFn: () => {
      const filteredList: Species[] = [];

      data.forEach((species) => {
        const isTypeMatch =
          types.length > 0
            ? species.types.some((type) => types.includes(type))
            : true;
        const isNameMatch = searchTerm
          ? species.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            species.num.toString().includes(searchTerm)
          : true;
        if (isTypeMatch && isNameMatch) {
          filteredList.push(species);
        }
      });

      return filteredList;
    },
  });
};
