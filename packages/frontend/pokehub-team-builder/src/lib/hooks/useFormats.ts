import type { GenerationNum } from '@pkmn/dex';
import type { BattleFormatInfo } from '@pokehub/frontend/pokemon-static-data';
import { useQuery } from '@tanstack/react-query';

/**
 * React Query hook to fetch and cache Pokemon battle formats for a generation
 *
 * This hook lazy-loads the format utilities (which depend on @pkmn/sim) and caches
 * the results per generation. The formats are static data that never changes, so
 * they're cached indefinitely.
 *
 * @param generation - Pokemon generation (1-9)
 * @returns React Query result with formats data, loading state, and error state
 *
 * @example
 * ```tsx
 * function FormatSelector({ generation }) {
 *   const { data: formats, isLoading, isError } = useFormats(generation);
 *
 *   if (isLoading) return <div>Loading formats...</div>;
 *   if (isError) return <div>Error loading formats</div>;
 *
 *   return (
 *     <select>
 *       {formats.map(format => (
 *         <option key={format.id} value={format.id}>
 *           {format.name}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * }
 * ```
 */
export function useFormats(generation: GenerationNum) {
  return useQuery({
    queryKey: ['formats', generation],
    queryFn: async (): Promise<BattleFormatInfo[]> => {
      // Lazy load ONLY the formats module (not the entire package)
      // This ensures @pkmn/sim is in the pokemon-showdown chunk, not the initial bundle
      const { getFormatsForGeneration } = await import(
        /* webpackChunkName: "formats" */
        '../utils/format-utils'
      );

      // Fetch and process formats for this generation
      return getFormatsForGeneration(generation);
    },
    // Formats are static data - never refetch
    staleTime: Infinity,
    // Keep in cache for 1 hour even after component unmounts
    gcTime: 1000 * 60 * 60,
    // Disable automatic retries since this is a static import
    retry: false,
  });
}
