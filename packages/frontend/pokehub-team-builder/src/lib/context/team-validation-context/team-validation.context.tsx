import type { TeamValidationContextData } from './team-validation-state.context.model';
import { createContext, useContext } from 'react';

export const TeamValidationContext = createContext<TeamValidationContextData>({
  getPokemonErrors: () => [],
  getTeamErrors: () => [],
  isTeamValid: false,
  state: {
    errors: [],
    isValid: false,
    timestamp: 0,
  },
  isReady: false,
});

export const useTeamValidationContext = () => {
  return useContext(TeamValidationContext);
};
