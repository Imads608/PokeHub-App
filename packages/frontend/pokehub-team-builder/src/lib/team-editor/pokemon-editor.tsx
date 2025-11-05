import type { Species } from '@pkmn/dex';

export interface PokemonEditorProps {
  activeSpecies: Species;
}

export const PokemonEditor = ({ activeSpecies }: PokemonEditorProps) => {
  return <div>PokemonEditor</div>;
};
