import type { TypeName } from '@pkmn/dex';

// Type effectiveness data
const typeEffectiveness: {
  [name in TypeName]: {
    weakTo: TypeName[];
    immuneTo: TypeName[];
    resistantTo: TypeName[];
  };
} = {
  Normal: { weakTo: ['Fighting'], resistantTo: [], immuneTo: ['Ghost'] },
  Fire: {
    weakTo: ['Water', 'Ground', 'Rock'],
    resistantTo: ['Fire', 'Grass', 'Ice', 'Bug', 'Steel', 'Fairy'],
    immuneTo: [],
  },
  Water: {
    weakTo: ['Electric', 'Grass'],
    resistantTo: ['Fire', 'Water', 'Ice', 'Steel'],
    immuneTo: [],
  },
  Electric: {
    weakTo: ['Ground'],
    resistantTo: ['Electric', 'Flying', 'Steel'],
    immuneTo: [],
  },
  Grass: {
    weakTo: ['Fire', 'Ice', 'Poison', 'Flying', 'Bug'],
    resistantTo: ['Water', 'Electric', 'Grass', 'Ground'],
    immuneTo: [],
  },
  Ice: {
    weakTo: ['Fire', 'Fighting', 'Rock', 'Steel'],
    resistantTo: ['Ice'],
    immuneTo: [],
  },
  Fighting: {
    weakTo: ['Flying', 'Psychic', 'Fairy'],
    resistantTo: ['Bug', 'Rock', 'Dark'],
    immuneTo: [],
  },
  Poison: {
    weakTo: ['Ground', 'Psychic'],
    resistantTo: ['Grass', 'Fighting', 'Poison', 'Bug', 'Fairy'],
    immuneTo: [],
  },
  Ground: {
    weakTo: ['Water', 'Grass', 'Ice'],
    resistantTo: ['Poison', 'Rock'],
    immuneTo: ['Electric'],
  },
  Flying: {
    weakTo: ['Electric', 'Ice', 'Rock'],
    resistantTo: ['Grass', 'Fighting', 'Bug'],
    immuneTo: ['Ground'],
  },
  Psychic: {
    weakTo: ['Bug', 'Ghost', 'Dark'],
    resistantTo: ['Fighting', 'Psychic'],
    immuneTo: [],
  },
  Bug: {
    weakTo: ['Fire', 'Flying', 'Rock'],
    resistantTo: ['Grass', 'Fighting', 'Ground'],
    immuneTo: [],
  },
  Rock: {
    weakTo: ['Water', 'Grass', 'Fighting', 'Ground', 'Steel'],
    resistantTo: ['Normal', 'Fire', 'Poison', 'Flying'],
    immuneTo: [],
  },
  Ghost: {
    weakTo: ['Ghost', 'Dark'],
    resistantTo: ['Poison', 'Bug'],
    immuneTo: ['Normal', 'Fighting'],
  },
  Dragon: {
    weakTo: ['Ice', 'Dragon', 'Fairy'],
    resistantTo: ['Fire', 'Water', 'Electric', 'Grass'],
    immuneTo: [],
  },
  Dark: {
    weakTo: ['Fighting', 'Bug', 'Fairy'],
    resistantTo: ['Ghost', 'Dark'],
    immuneTo: ['Psychic'],
  },
  Steel: {
    weakTo: ['Fire', 'Fighting', 'Ground'],
    resistantTo: [
      'Normal',
      'Grass',
      'Ice',
      'Flying',
      'Psychic',
      'Bug',
      'Rock',
      'Dragon',
      'Steel',
      'Fairy',
    ],
    immuneTo: ['Poison'],
  },
  Fairy: {
    weakTo: ['Poison', 'Steel'],
    resistantTo: ['Fighting', 'Bug', 'Dark'],
    immuneTo: ['Dragon'],
  },
  '???': { weakTo: [], resistantTo: [], immuneTo: [] },
  Stellar: { weakTo: [], resistantTo: [], immuneTo: [] },
};

export const getTypeEffectiveness = () => typeEffectiveness;

export const getTypeEffectivenessForTypes = (types: TypeName[]) => {
  const effectiveness: { [name in TypeName]?: number } = {};

  // Initialize all types with 1x effectiveness
  Object.keys(typeEffectiveness).forEach((type) => {
    type !== 'Stellar' &&
      type !== '???' &&
      (effectiveness[type as TypeName] = 1);
  });

  // Apply effectiveness for each of the Pokemon's types
  types.forEach((pokeType) => {
    const typeData = typeEffectiveness[pokeType];

    // Apply weaknesses (2x damage)
    typeData.weakTo.forEach((type) => {
      effectiveness[type] && (effectiveness[type] *= 2);
    });

    // Apply resistances (0.5x damage)
    typeData.resistantTo.forEach((type) => {
      effectiveness[type] && (effectiveness[type] *= 0.5);
    });

    // Apply immunities (0x damage)
    typeData.immuneTo.forEach((type) => {
      effectiveness[type] = 0;
    });
  });
  const weakTo = Object.entries(effectiveness)
    .filter(([_, value]) => value > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([type, value]) => ({ type: type as TypeName, value }));

  const resistantTo = Object.entries(effectiveness)
    .filter(([_, value]) => value < 1 && value > 0)
    .sort((a, b) => a[1] - b[1])
    .map(([type, value]) => ({ type: type as TypeName, value }));

  const immuneTo = Object.entries(effectiveness)
    .filter(([_, value]) => value === 0)
    .map(([type]) => type as TypeName);

  return { weakTo, resistantTo, immuneTo };
};

/**
 * Get offensive type effectiveness for an attacking type
 * Derives from defensive type effectiveness data
 */
export function getOffensiveTypeEffectiveness(attackingType: TypeName): {
  superEffectiveAgainst: TypeName[];
  notVeryEffectiveAgainst: TypeName[];
  noEffectAgainst: TypeName[];
} {
  const superEffectiveAgainst: TypeName[] = [];
  const notVeryEffectiveAgainst: TypeName[] = [];
  const noEffectAgainst: TypeName[] = [];

  // Loop through all defending types and check their defensive matchups
  (Object.entries(typeEffectiveness) as [TypeName, typeof typeEffectiveness[TypeName]][]).forEach(
    ([defendingType, data]) => {
      // Skip special types
      if (defendingType === 'Stellar' || defendingType === '???') return;

      // If defending type is weak to attacking type, attacking type is SE
      if (data.weakTo.includes(attackingType)) {
        superEffectiveAgainst.push(defendingType);
      }

      // If defending type resists attacking type, attacking type is NVE
      if (data.resistantTo.includes(attackingType)) {
        notVeryEffectiveAgainst.push(defendingType);
      }

      // If defending type is immune to attacking type, attacking type has no effect
      if (data.immuneTo.includes(attackingType)) {
        noEffectAgainst.push(defendingType);
      }
    }
  );

  return { superEffectiveAgainst, notVeryEffectiveAgainst, noEffectAgainst };
}

/**
 * Calculate combined offensive coverage for multiple move types
 * Accepts full move list (with duplicates) to track move counts
 * Returns both coverage sets and detailed counts
 */
export function getCombinedOffensiveCoverage(moveTypes: TypeName[]): {
  superEffectiveCoverage: Set<TypeName>;
  superEffectiveCoverageCounts: Map<TypeName, number>;
  notVeryEffectiveCoverage: Set<TypeName>;
  noEffectCoverage: Set<TypeName>;
} {
  const superEffectiveCoverage = new Set<TypeName>();
  const superEffectiveCoverageCounts = new Map<TypeName, number>();
  const notVeryEffectiveCoverage = new Set<TypeName>();
  let noEffectCoverage = new Set<TypeName>();

  // Handle empty moveset
  if (moveTypes.length === 0) {
    return {
      superEffectiveCoverage,
      superEffectiveCoverageCounts,
      notVeryEffectiveCoverage,
      noEffectCoverage,
    };
  }

  // Get unique move types for calculating coverage sets
  const uniqueMoveTypes = Array.from(new Set(moveTypes));

  // Initialize noEffectCoverage with first move's immunities
  const firstEffectiveness = getOffensiveTypeEffectiveness(uniqueMoveTypes[0]);
  noEffectCoverage = new Set(firstEffectiveness.noEffectAgainst);

  // Build coverage sets using unique move types
  uniqueMoveTypes.forEach((moveType) => {
    const effectiveness = getOffensiveTypeEffectiveness(moveType);

    effectiveness.superEffectiveAgainst.forEach((type) => {
      superEffectiveCoverage.add(type);
      // Remove from not very effective if we have SE coverage
      notVeryEffectiveCoverage.delete(type);
    });

    effectiveness.notVeryEffectiveAgainst.forEach((type) => {
      // Only add to NVE if we don't already have SE coverage
      if (!superEffectiveCoverage.has(type)) {
        notVeryEffectiveCoverage.add(type);
      }
    });

    // For noEffect: only keep types that ALL moves cannot hit (intersection)
    const cantHit = new Set(effectiveness.noEffectAgainst);
    Array.from(noEffectCoverage).forEach((type) => {
      if (!cantHit.has(type)) {
        noEffectCoverage.delete(type);
      }
    });
  });

  // Count how many moves hit each type SE (using full list with duplicates)
  // Cache effectiveness to avoid redundant calculations
  const effectivenessCache = new Map<
    TypeName,
    ReturnType<typeof getOffensiveTypeEffectiveness>
  >();

  moveTypes.forEach((moveType) => {
    if (!effectivenessCache.has(moveType)) {
      effectivenessCache.set(moveType, getOffensiveTypeEffectiveness(moveType));
    }
    const effectiveness = effectivenessCache.get(moveType)!;

    effectiveness.superEffectiveAgainst.forEach((type) => {
      superEffectiveCoverageCounts.set(
        type,
        (superEffectiveCoverageCounts.get(type) || 0) + 1
      );
    });
  });

  return {
    superEffectiveCoverage,
    superEffectiveCoverageCounts,
    notVeryEffectiveCoverage,
    noEffectCoverage,
  };
}

/**
 * Get all standard Pokemon types (excluding special types like Stellar and ???)
 */
export function getAllTypes(): TypeName[] {
  return [
    'Normal',
    'Fire',
    'Water',
    'Electric',
    'Grass',
    'Ice',
    'Fighting',
    'Poison',
    'Ground',
    'Flying',
    'Psychic',
    'Bug',
    'Rock',
    'Ghost',
    'Dragon',
    'Dark',
    'Steel',
    'Fairy',
  ];
}

/**
 * Get coverage gaps - types that are not hit super-effectively by any move
 */
export function getCoverageGaps(moveTypes: TypeName[]): TypeName[] {
  const { superEffectiveCoverage } = getCombinedOffensiveCoverage(moveTypes);

  return getAllTypes().filter((type) => !superEffectiveCoverage.has(type));
}
