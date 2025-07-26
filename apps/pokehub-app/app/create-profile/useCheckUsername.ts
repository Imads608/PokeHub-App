'use client';

import {
  getFetchClient,
  withAuthRetry,
} from '@pokehub/frontend/shared-data-provider';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export const useCheckUsername = (username: string) => {
  const { data } = useSession();
  return useQuery({
    queryKey: [
      'users',
      username,
      { queryType: 'availability', dataType: 'username' },
    ],
    queryFn: async () => {
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
    },
    enabled: !!username,
    retry: false,
  });
};
