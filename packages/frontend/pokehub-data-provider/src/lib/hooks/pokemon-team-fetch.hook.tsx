import { useQuery } from '@tanstack/react-query';

export interface PokemonTeamLoadOptions {
  enabled?: boolean;
}

export const useLoadPokemonTeam = (
  teamId: string,
  options?: PokemonTeamLoadOptions
) => {
  return useQuery({
    queryKey: ['pokemon-team', teamId],
    queryFn: async () => {
      return undefined;
    },
    enabled: options?.enabled,
  });
};
