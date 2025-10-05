import type { FetchResponse } from './fetch-client';
import { FetchApiError } from './fetch-client';
import { getAuthSession } from '@pokehub/frontend/shared-auth';

export const withAuthRetry = async <Data>(
  accessToken: string,
  request: (accessToken: string) => Promise<FetchResponse<Data>>
): Promise<FetchResponse<Data>> => {
  try {
    const res = await request(accessToken);
    return res;
  } catch (error) {
    if ((error as FetchApiError).status === 401) {
      const session = await getAuthSession();
      if (!session?.accessToken) {
        throw new FetchApiError('Unauthorized', 401);
      }
      const res = await request(session.accessToken);
      return res;
    }
    throw error;
  }
};
