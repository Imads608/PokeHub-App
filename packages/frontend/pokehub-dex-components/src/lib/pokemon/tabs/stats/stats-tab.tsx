import { GenerationNum, Species } from '@pkmn/dex';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Separator,
  TabsContent,
} from '@pokehub/frontend/shared-ui-components';
import {
  getTypeEffectivenessForTypes,
  typeColors,
} from '@pokehub/frontend/shared-utils';
import { Shield, Swords } from 'lucide-react';
import { useMemo } from 'react';

export interface PokemonStatsTabProps {
  generation: GenerationNum;
  pokemonDetails: Species;
}

export const PokemonStatsTab = ({
  generation,
  pokemonDetails,
}: PokemonStatsTabProps) => {
  const { weakTo, immuneTo, resistantTo } = useMemo(
    () => getTypeEffectivenessForTypes(pokemonDetails.types),
    [pokemonDetails.types]
  );

  return (
    <TabsContent value="stats" className="mt-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Base Stats</CardTitle>
            <CardDescription>
              The base statistics of this Pokémon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">HP</span>
                  <span className="text-sm">{pokemonDetails.baseStats.hp}</span>
                </div>
                <Progress
                  value={(pokemonDetails.baseStats.hp / 255) * 100}
                  className="h-2"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">Attack</span>
                  <span className="text-sm">
                    {pokemonDetails.baseStats.atk}
                  </span>
                </div>
                <Progress
                  value={(pokemonDetails.baseStats.atk / 255) * 100}
                  className="h-2"
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">Defense</span>
                  <span className="text-sm">
                    {pokemonDetails.baseStats.def}
                  </span>
                </div>
                <Progress
                  value={(pokemonDetails.baseStats.def / 255) * 100}
                  className="h-2"
                />
              </div>
              {generation > 1 ? (
                <>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium">Sp. Attack</span>
                      <span className="text-sm">
                        {pokemonDetails.baseStats.spa}
                      </span>
                    </div>
                    <Progress
                      value={(pokemonDetails.baseStats.spa / 255) * 100}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium">Sp. Defense</span>
                      <span className="text-sm">
                        {pokemonDetails.baseStats.spd}
                      </span>
                    </div>
                    <Progress
                      value={(pokemonDetails.baseStats.spd / 255) * 100}
                      className="h-2"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">Special</span>
                    <span className="text-sm">
                      {pokemonDetails.baseStats.spa}
                    </span>
                  </div>
                  <Progress
                    value={(pokemonDetails.baseStats.spa / 255) * 100}
                    className="h-2"
                  />
                </div>
              )}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">Speed</span>
                  <span className="text-sm">
                    {pokemonDetails.baseStats.spe}
                  </span>
                </div>
                <Progress
                  value={(pokemonDetails.baseStats.spe / 255) * 100}
                  className="h-2"
                />
              </div>

              <Separator />
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-sm">{pokemonDetails.bst}</span>
                </div>
                <Progress
                  value={(pokemonDetails.bst / 1530) * 100}
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

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
      </div>
    </TabsContent>
  );
};
