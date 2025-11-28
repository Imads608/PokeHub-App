import { useQuery } from '@tanstack/react-query';
import { getFormatRules } from '@pokehub/shared/pokemon-showdown-validation';

/**
 * Query key factory for format rules
 */
export const getFormatRulesQueryKey = (formatId: string) => {
  return ['format-rules', formatId] as const;
};

/**
 * Hook to get format rules with React Query caching
 * @param formatId - Showdown format ID (e.g., 'gen9ou', 'gen9uu')
 * @returns Query result with format rules
 */
export function useFormatRules(formatId: string) {
  return useQuery({
    queryKey: getFormatRulesQueryKey(formatId),
    queryFn: () => getFormatRules(formatId),
    staleTime: Infinity, // Format data never changes
    gcTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}
