import type { GenerationNum } from '@pkmn/dex';
import type {
  ContextFieldType,
  ContextField,
} from '@pokehub/frontend/shared-context';

export type TeamSortBy = 'name' | 'created' | 'updated';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';

export interface TeamViewerFilters<T extends ContextFieldType> {
  searchTerm: ContextField<string, T>;
  selectedGeneration: ContextField<GenerationNum | 'all', T>;
  selectedFormat: ContextField<string | 'all', T>;
  sortBy: ContextField<TeamSortBy, T>;
  sortOrder: ContextField<SortOrder, T>;
  viewMode: ContextField<ViewMode, T>;
}
