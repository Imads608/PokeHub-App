import { usePokemonDexDetailsContext } from '../../context/pokemon-dex-details.context';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@pokehub/frontend/shared-ui-components';
import {
  getTypeEffectivenessForTypes,
  typeColors,
} from '@pokehub/frontend/shared-utils';
import { Shield, Swords } from 'lucide-react';
import { useMemo } from 'react';

export const TypeEffectivenessCard = () => {
  const {
    selectedForm: { pokemon },
  } = usePokemonDexDetailsContext();

  const { weakTo, immuneTo, resistantTo } = useMemo(
    () =>
      pokemon.value
        ? getTypeEffectivenessForTypes(pokemon.value.types)
        : { weakTo: [], immuneTo: [], resistantTo: [] },
    [pokemon.value]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Type Effectiveness</CardTitle>
        <CardDescription>
          How different types affect this Pokémon
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {weakTo.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Swords className="h-4 w-4 text-destructive" />
                Weak to
              </h4>
              <div className="flex flex-wrap gap-2">
                {weakTo.map(({ type, value }) => (
                  <Badge
                    key={type}
                    className={`${
                      typeColors[type as keyof typeof typeColors]
                    } capitalize`}
                  >
                    {type} {value === 4 ? '(4x)' : '(2x)'}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {resistantTo.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4 text-primary" />
                Resistant to
              </h4>
              <div className="flex flex-wrap gap-2">
                {resistantTo.map(({ type, value }) => (
                  <Badge
                    key={type}
                    className={`${
                      typeColors[type as keyof typeof typeColors]
                    } capitalize`}
                  >
                    {type} {value === 0.25 ? '(¼x)' : '(½x)'}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {immuneTo.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4 text-secondary" />
                Immune to
              </h4>
              <div className="flex flex-wrap gap-2">
                {immuneTo.map((type) => (
                  <Badge
                    key={type}
                    className={`${
                      typeColors[type as keyof typeof typeColors]
                    } capitalize`}
                  >
                    {type} (0x)
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
