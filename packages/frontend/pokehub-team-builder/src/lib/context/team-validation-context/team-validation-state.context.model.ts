import type { ValidationError } from '@pokehub/shared/pokemon-types';

export interface TeamValidationState {
  isValid: boolean;
  errors: ValidationError[];
  timestamp: number; // For tracking when validation was last run
}

export interface TeamValidationContextData {
  state: TeamValidationState;
  getTeamErrors: () => ValidationError[];
  getPokemonErrors: (index: number) => ValidationError[];
  isTeamValid: boolean;
  isReady?: boolean;
}
