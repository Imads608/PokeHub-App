import type { GenerationNum, Tier } from '@pkmn/dex';
import type {
  BattleFormat,
  PokemonInTeam,
} from '@pokehub/frontend/pokemon-types';
import type {
  ContextFieldType,
  ContextField,
} from '@pokehub/frontend/shared-context';

export interface TeamEditorContextModel<T extends ContextFieldType> {
  generation: ContextField<GenerationNum, T>;
  tier: ContextField<Tier.Singles | Tier.Doubles, T>;
  format: ContextField<BattleFormat, T>;
  teamName: ContextField<string | undefined, T>;
  teamPokemon: ContextField<(PokemonInTeam | undefined)[], T>;
}
