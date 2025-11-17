import type { Tier } from '@pkmn/dex';
import type { BattleTier, BattleFormat } from '@pokehub/frontend/pokemon-types';

const singlesBattleTiers: BattleTier<'Singles'>[] = [
  {
    name: 'Anything Goes',
    id: 'AG',
    description: 'No restrictions tier allowing any Pokémon and strategies',
  },
  {
    name: 'Ubers',
    id: 'Uber',
    description:
      'The most powerful Pokémon, including many legendaries and megas',
  },
  {
    name: 'Ubers (Unranked)',
    id: '(Uber)',
    description: 'Ubers tier Pokémon that are not officially ranked',
  },
  {
    name: 'OverUsed',
    id: 'OU',
    description: 'The standard competitive tier with commonly used Pokémon',
  },
  {
    name: 'OverUsed (Unranked)',
    id: '(OU)',
    description: 'OU tier Pokémon that are not officially ranked',
  },
  {
    name: 'UnderUsed Banlist',
    id: 'UUBL',
    description: 'Pokémon banned from UU but not used enough for OU',
  },
  {
    name: 'UnderUsed',
    id: 'UU',
    description: 'Powerful Pokémon that are less common in OU',
  },
  {
    name: 'RarelyUsed Banlist',
    id: 'RUBL',
    description: 'Pokémon banned from RU but not used enough for UU',
  },
  {
    name: 'RarelyUsed',
    id: 'RU',
    description: 'Solid Pokémon that see less usage in higher tiers',
  },
  {
    name: 'NeverUsed Banlist',
    id: 'NUBL',
    description: 'Pokémon banned from NU but not used enough for RU',
  },
  {
    name: 'NeverUsed',
    id: 'NU',
    description: 'Competitive Pokémon not commonly seen in higher tiers',
  },
  {
    name: 'NeverUsed (Unranked)',
    id: '(NU)',
    description: 'NU tier Pokémon that are not officially ranked',
  },
  {
    name: 'Partially Used Banlist',
    id: 'PUBL',
    description: 'Pokémon banned from PU but not used enough for NU',
  },
  {
    name: 'Partially Used',
    id: 'PU',
    description: 'Lower tier Pokémon that still have competitive viability',
  },
  {
    name: 'Partially Used (Unranked)',
    id: '(PU)',
    description: 'PU tier Pokémon that are not officially ranked',
  },
  {
    name: 'Not Fully Evolved',
    id: 'NFE',
    description: 'Pokémon that can still evolve',
  },
  {
    name: 'Little Cup',
    id: 'LC',
    description: 'Competitive tier for unevolved Pokémon at level 5',
  },
];

const doublesBattleTiers: BattleTier<'Doubles'>[] = [
  {
    name: 'Doubles Ubers',
    id: 'DUber',
    description:
      'The most powerful Pokémon in doubles format, including legendaries',
  },
  {
    name: 'Doubles Ubers (Unranked)',
    id: '(DUber)',
    description: 'Doubles Ubers tier Pokémon that are not officially ranked',
  },
  {
    name: 'Doubles OverUsed',
    id: 'DOU',
    description: 'The standard competitive doubles tier',
  },
  {
    name: 'Doubles OverUsed (Unranked)',
    id: '(DOU)',
    description: 'DOU tier Pokémon that are not officially ranked',
  },
  {
    name: 'Doubles Banlist',
    id: 'DBL',
    description: 'Pokémon banned from lower doubles tiers',
  },
  {
    name: 'Doubles UnderUsed',
    id: 'DUU',
    description: 'Doubles tier for less commonly used Pokémon',
  },
  {
    name: 'Doubles UnderUsed (Unranked)',
    id: '(DUU)',
    description: 'DUU tier Pokémon that are not officially ranked',
  },
  {
    name: 'Not Fully Evolved',
    id: 'NFE',
    description: 'Pokémon that can still evolve',
  },
  {
    name: 'Little Cup',
    id: 'LC',
    description: 'Competitive tier for unevolved Pokémon at level 5',
  },
];

const singlesBattleTiersHierarchy: Tier.Singles[] = [
  'AG',
  'Uber',
  'OU',
  'UUBL',
  'UU',
  'RUBL',
  'RU',
  'NUBL',
  'NU',
  'PUBL',
  'PU',
  'NFE',
  'LC',
];

const doublesBattleTiersHierarchy: Tier.Doubles[] = [
  'DUber',
  'DOU',
  'DBL',
  'DUU',
  'NFE',
  'LC',
];

interface FilterProps {
  excludeTechnicality?: boolean;
  excludeBanlist?: boolean;
}

export const getSinglesBattleTiers = (
  filterProps?: FilterProps
): BattleTier<'Singles'>[] => {
  return !filterProps
    ? singlesBattleTiers
    : (filterBattleTier(
        singlesBattleTiers,
        filterProps
      ) as BattleTier<'Singles'>[]);
};

export const getBattleTiersForFormat = (
  format: BattleFormat,
  filterProps?: FilterProps
) => {
  const battleTier =
    format === 'Singles' ? singlesBattleTiers : doublesBattleTiers;
  return filterProps ? filterBattleTier(battleTier, filterProps) : battleTier;
};

export const getBattleTierInfo = (tier: Tier.Singles | Tier.Doubles) => {
  let battleTierInfo:
    | BattleTier<'Singles'>
    | BattleTier<'Doubles'>
    | undefined = singlesBattleTiers.find((val) => val.id === tier);
  if (battleTierInfo) {
    return battleTierInfo;
  }
  battleTierInfo = doublesBattleTiers.find((val) => val.id === tier);

  return battleTierInfo;
};

export const getDoublesBattleTiers = (
  filterProps?: FilterProps
): BattleTier<'Doubles'>[] => {
  return !filterProps
    ? doublesBattleTiers
    : (filterBattleTier(
        doublesBattleTiers,
        filterProps
      ) as BattleTier<'Doubles'>[]);
};

export const getSinglesBattleTierHierarchy = () => {
  return singlesBattleTiersHierarchy;
};

export const getDoublesBattleTierHierarchy = () => {
  return doublesBattleTiersHierarchy;
};

const filterBattleTier = (
  battleTiers: BattleTier<'Singles'>[] | BattleTier<'Doubles'>[],
  filterProps: FilterProps
) => {
  const filteredTiers = battleTiers.filter((currVal) => {
    if (filterProps.excludeBanlist && currVal.id.includes('BL')) {
      return false;
    }
    if (filterProps.excludeTechnicality && currVal.id.includes('(')) {
      return false;
    }
    return true;
  });
  return filteredTiers;
};
