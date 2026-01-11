'use client';

// NOTE: Type augmentations for Session are in @pokehub/frontend/global-next-types
// but we can't import that module here as it causes Turbopack to trace into
// next-auth's server code. The Session type from next-auth will still work,
// and TypeScript will pick up the augmented types from the tsconfig includes.
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
