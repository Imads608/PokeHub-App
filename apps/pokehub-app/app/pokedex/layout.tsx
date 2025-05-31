import { PokemonDexDetailsProvider } from '@pokehub/frontend/pokehub-dex-components';

export default function PokedexLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PokemonDexDetailsProvider>{children}</PokemonDexDetailsProvider>;
}
