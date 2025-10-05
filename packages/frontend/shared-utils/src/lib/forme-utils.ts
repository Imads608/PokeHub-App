import type { Species } from '@pkmn/dex';

export const isBaseForme = (pokemon: Species) => {
  const lowerCaseName = pokemon.name.toLowerCase();
  return !(
    lowerCaseName.includes('gmax') ||
    lowerCaseName.includes('mega') ||
    lowerCaseName.includes('primal')
  );
};
