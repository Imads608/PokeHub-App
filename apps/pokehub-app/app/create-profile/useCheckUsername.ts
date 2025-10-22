'use client';

import { withAuthRetry } from '@pokehub/frontend/pokehub-data-provider';
import { useAuthSession } from '@pokehub/frontend/shared-auth';
import { getFetchClient } from '@pokehub/frontend/shared-data-provider';
import { useQuery } from '@tanstack/react-query';

export const useCheckUsername = (username: string) => {
  const { data } = useAuthSession();
  return useQuery({
    queryKey: [
      'users',
      username,
      { queryType: 'availability', dataType: 'username' },
    ],
    queryFn: async () => {
      try {
        const { accessToken } = data || {};
        accessToken &&
          (await withAuthRetry(accessToken, () =>
            getFetchClient('API').fetchThrowsError(
              `/users/${username}?dataType=username`,
              {
                method: 'HEAD',
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            )
          ));
        return null;
      } catch (error) {
        console.log('Error checking username availability:', error);
        throw error;
      }
    },
    enabled: !!username,
    retry: false,
  });
};
