const pkmnDexToPokeAPINameMap: { [key: string]: string } = {
  lycanroc: 'lycanroc-midday',
};

export const getPokeAPIName = (pkmnDexName: string) => {
  return (
    pkmnDexToPokeAPINameMap[pkmnDexName.toLowerCase()] ||
    pkmnDexName.toLowerCase()
  );
};
