import { getFetchClient } from '@pokehub/frontend/shared-data-provider';
import { useQuery } from '@tanstack/react-query';

export const useCheckUsername = (username: string, enabled: boolean) => {
  return useQuery({
    queryKey: ['users', username, { dataType: 'username' }],
    queryFn: async () => {
      return getFetchClient('API').fetchThrowsError(
        `/users/${username}?dataType=username`,
        { method: 'HEAD' }
      );
    },
    enabled,
  });
};
