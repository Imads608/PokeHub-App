import type { TypeName } from '@pkmn/dex';
import { Badge } from '@pokehub/frontend/shared-ui-components';
import { typeColors } from '@pokehub/frontend/shared-utils';

export const PokemonTypeBadge = ({
  pokemonType,
  className,
}: {
  pokemonType: TypeName;
  className?: string;
}) => {
  return (
    <Badge
      key={pokemonType}
      className={`${
        typeColors[pokemonType as keyof typeof typeColors]
      } pointer-events-none text-xs capitalize hover:bg-current ${className}`}
    >
      {pokemonType}
    </Badge>
  );
};
