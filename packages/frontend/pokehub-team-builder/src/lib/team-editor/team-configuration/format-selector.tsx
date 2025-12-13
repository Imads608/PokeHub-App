import { useFormats } from '../../hooks/useFormats';
import type { GenerationNum } from '@pkmn/dex';
import { Skeleton } from '@pokehub/frontend/shared-ui-components';
import type { ComboboxGroup } from '@pokehub/frontend/shared-ui-components/combobox';
import { Combobox } from '@pokehub/frontend/shared-ui-components/combobox';
import { useMemo } from 'react';

export interface FormatSelectorProps {
  /** Current generation */
  generation: GenerationNum;
  /** Selected format ID (without gen prefix) */
  value?: string;
  /** Callback when format changes */
  onValueChange?: (formatId: string) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Format selector component with searchable, grouped, and collapsible format options
 *
 * Lazy-loads format data from Pokemon Showdown and displays them in organized categories.
 * Supports search, collapsible categories, and caching via React Query.
 *
 * @example
 * ```tsx
 * <FormatSelector
 *   generation={9}
 *   value="ou"
 *   onValueChange={(formatId) => console.log('Selected:', formatId)}
 * />
 * ```
 */
export function FormatSelector({
  generation,
  value,
  onValueChange,
  disabled = false,
  className,
}: FormatSelectorProps) {
  const { data: formats, isLoading, isError } = useFormats(generation);

  // Transform formats into Combobox groups
  const groups = useMemo((): ComboboxGroup[] => {
    if (!formats) return [];

    // Group formats by category
    const categoryMap = new Map<string, typeof formats>();

    for (const format of formats) {
      const existing = categoryMap.get(format.category) || [];
      categoryMap.set(format.category, [...existing, format]);
    }

    // Convert to ComboboxGroup format
    const comboboxGroups: ComboboxGroup[] = [];

    // Define which categories should be expanded by default
    const defaultExpandedCategories = new Set(['Singles', 'Doubles', 'VGC']);

    for (const [category, categoryFormats] of categoryMap) {
      comboboxGroups.push({
        category,
        options: categoryFormats.map((format) => ({
          value: format.id,
          label: format.name,
          description: format.description,
        })),
        defaultExpanded: defaultExpandedCategories.has(category),
      });
    }

    return comboboxGroups;
  }, [formats]);

  // Loading state
  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  // Error state
  if (isError) {
    return (
      <div className="flex h-10 w-full items-center justify-center rounded-md border border-destructive bg-destructive/10 text-sm text-destructive">
        Error loading formats
      </div>
    );
  }

  // Render combobox
  return (
    <Combobox
      id="format"
      data-testid="format-selector"
      value={value}
      onValueChange={onValueChange}
      groups={groups}
      placeholder="Select format..."
      searchPlaceholder="Search formats..."
      emptyText="No formats found"
      disabled={disabled}
      className={className}
    />
  );
}
