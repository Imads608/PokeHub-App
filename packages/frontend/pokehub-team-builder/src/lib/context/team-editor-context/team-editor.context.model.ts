import type { GenerationNum, Tier } from '@pkmn/dex';
import type {
  ContextFieldType,
  ContextField,
} from '@pokehub/frontend/shared-context';
import type {
  BattleFormat,
  PokemonInTeam,
} from '@pokehub/shared/pokemon-types';

export interface TeamEditorContextModel<T extends ContextFieldType> {
  generation: ContextField<GenerationNum, T>;
  tier: ContextField<Tier.Singles | Tier.Doubles, T>;
  format: ContextField<BattleFormat, T>;
  teamName: ContextField<string | undefined, T>;
  teamPokemon: ContextField<PokemonInTeam[], T>;
  activePokemon: ContextField<PokemonInTeam | undefined, T>;
  showdownFormatId: string;
}
