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
