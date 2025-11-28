import type { GenerationNum, Species, TypeName } from '@pkmn/dex';
import { useQuery } from '@tanstack/react-query';

export interface FilterPokemonListOptions {
  searchTerm?: string;
  types: TypeName[];
  generation: GenerationNum;
  format: string;
  enabled?: boolean;
}

// Tier ranking for sorting (lower number = higher tier)
const TIER_RANKINGS: Record<string, number> = {
  // Singles tiers
  AG: 1,
  Uber: 2,
  OU: 3,
  UUBL: 4,
  UU: 5,
  RUBL: 6,
  RU: 7,
  NUBL: 8,
  NU: 9,
  PUBL: 10,
  PU: 11,
  ZUBL: 12,
  ZU: 13,
  '(PU)': 14,
  '(NU)': 15,
  NFE: 16,
  LC: 17,
  'LC Uber': 18,

  // Doubles tiers
  DUber: 1,
  DOU: 2,
  DBL: 3,
  DUU: 4,
  '(DUU)': 5,
  DNU: 6,

  // Other tiers
  Unreleased: 999,
  Illegal: 1000,
};

const getTierRank = (tier: string): number => {
  return TIER_RANKINGS[tier] ?? 500; // Default to middle rank for unknown tiers
};

export const useFilterPokemonList = (
  data: Species[],
  { searchTerm, types, generation, format, enabled }: FilterPokemonListOptions
) => {
  return useQuery({
    enabled,
    queryKey: [
      'pokedex-competitive-search',
      { generation, format },
      { searchTerm, types },
    ],
    queryFn: () => {
      const isDoubles = format.includes('doubles') || format.includes('vgc');
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

      // Sort by tier (highest to lowest)
      filteredList.sort((a, b) => {
        const tierA = isDoubles ? a.doublesTier : a.tier;
        const tierB = isDoubles ? b.doublesTier : b.tier;

        const rankA = getTierRank(tierA);
        const rankB = getTierRank(tierB);

        // Primary sort: by tier rank (ascending rank = descending tier)
        if (rankA !== rankB) {
          return rankA - rankB;
        }

        // Secondary sort: by Pokedex number
        return a.num - b.num;
      });

      return filteredList;
    },
  });
};
