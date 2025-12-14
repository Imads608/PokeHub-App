/**
 * Query keys for teams cache
 */
export const teamsKeys = {
  all: ['teams'] as const,
  detail: (id: string) => ['teams', 'detail', id] as const,
};
