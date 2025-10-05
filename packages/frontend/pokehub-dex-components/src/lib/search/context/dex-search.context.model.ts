import type { GenerationNum, TypeName } from '@pkmn/dex';
import type {
  ContextFieldType,
  ContextField,
} from '@pokehub/frontend/shared-context';

export interface DexSearchFilters<T extends ContextFieldType> {
  types: ContextField<TypeName[] | undefined, T>;
  generations: ContextField<GenerationNum[] | undefined, T>;
  searchTerm: ContextField<string | undefined, T>;
  sortOrder: ContextField<'asc' | 'desc', T>;
  sortBy: ContextField<'id' | 'name' | 'hp' | 'attack' | 'defense', T>;
}
