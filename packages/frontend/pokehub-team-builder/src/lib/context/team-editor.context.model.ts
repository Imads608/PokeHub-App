import type { GenerationNum, Tier } from '@pkmn/dex';
import type {
  ContextFieldType,
  ContextField,
} from '@pokehub/frontend/shared-context';
import type {
  BattleFormat,
  PokemonInTeam,
} from '@pokehub/shared/pokemon-types';
import type { ValidationError } from '@pokehub/shared/pokemon-types';

export interface TeamValidationState {
  isValid: boolean;
  errors: ValidationError[];
  showdownFormatId: string;
  timestamp: number; // For tracking when validation was last run
}

export interface TeamEditorContextModel<T extends ContextFieldType> {
  generation: ContextField<GenerationNum, T>;
  tier: ContextField<Tier.Singles | Tier.Doubles, T>;
  format: ContextField<BattleFormat, T>;
  teamName: ContextField<string | undefined, T>;
  teamPokemon: ContextField<PokemonInTeam[], T>;
  activePokemon: ContextField<PokemonInTeam | undefined, T>;
  validation: {
    state: TeamValidationState;
    getTeamErrors: () => ValidationError[];
    getPokemonErrors: (index: number) => ValidationError[];
    isTeamValid: boolean;
    showdownFormatId: string;
  };
}
