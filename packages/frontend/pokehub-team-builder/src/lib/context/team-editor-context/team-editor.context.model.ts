import type { GenerationNum } from '@pkmn/dex';
import type {
  ContextFieldType,
  ContextField,
} from '@pokehub/frontend/shared-context';
import type { PokemonInTeam } from '@pokehub/shared/pokemon-types';

export interface TeamEditorContextModel<T extends ContextFieldType> {
  generation: ContextField<GenerationNum, T>;
  /**
   * Format ID (Showdown format without gen prefix)
   * Examples: 'ou', 'vgc2024rege', 'nationaldex', 'monotypefire'
   */
  format: ContextField<string, T>;
  teamName: ContextField<string, T>;
  teamPokemon: ContextField<PokemonInTeam[], T>;
  activePokemon: ContextField<PokemonInTeam | undefined, T>;
  showdownFormatId: string;
}
