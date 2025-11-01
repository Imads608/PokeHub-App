import '@pokehub/frontend/global-next-types';
import type { Session } from 'next-auth';
import { useSession } from 'next-auth/react';

type TypedSessionReturn = Omit<ReturnType<typeof useSession>, 'update'> & {
  update: (data: Partial<Session>) => Promise<Session | null>;
};

export const useAuthSession = (): TypedSessionReturn => {
  const session = useSession();

  return {
    ...session,
    update: async (data: Partial<Session>) => await session.update(data),
  };
};
