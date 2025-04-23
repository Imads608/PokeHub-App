import { FC } from 'react';

export type Provider = FC<{ children: React.ReactNode }>;

export const buildProviderTree = (providers: Provider[]): Provider => {
  if (providers.length === 1) {
    return providers[0];
  }

  if (providers.length === 2) {
    const [A, B] = providers;
    return ({ children }) => (
      <A>
        <B>{children}</B>
      </A>
    );
  }

  const [A, B, ...rest] = providers;

  if (!A || !B) {
    throw new Error('Invalid provider tree');
  }

  return buildProviderTree([
    ({ children }) => (
      <A>
        <B>{children}</B>
      </A>
    ),
    ...rest,
  ]);
};

export default buildProviderTree;
