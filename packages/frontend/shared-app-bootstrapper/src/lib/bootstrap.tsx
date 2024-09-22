import { FC } from 'react';

export type Provider = FC<{ children: React.ReactNode }>;

export interface SharedAppBootstrapperProps {
  children: React.ReactNode | React.ReactNode[];
  providers: Provider[];
}

export const SharedAppBootstrapper = ({ children, providers }: SharedAppBootstrapperProps) => {
  const Providers = BuildProviderTree(providers);

  return <Providers>{children}</Providers>;
};

const BuildProviderTree = (providers: Provider[]): Provider => {
  if (providers.length === 1) {
    return providers[0];
  }
  const A = providers.shift();
  const B = providers.shift();

  if (!A || !B) {
    throw new Error('Invalid provider tree');
  }

  return BuildProviderTree([
    ({ children }) => (
      <A>
        <B>{children}</B>
      </A>
    ),
    ...providers,
  ]);
};
