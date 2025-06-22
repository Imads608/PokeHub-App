import { usePokemonDexDetailsContext } from '../../context/pokemon-dex-details.context';
import { useAbiltiesDetails } from '../../hooks/useAbilitiesDetails';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@pokehub/frontend/shared-ui-components';
import { Info } from 'lucide-react';
import { useEffect, useState } from 'react';

export const AbilitiesCard = () => {
  const {
    selectedForm: { pokemon },
    selectedGeneration,
  } = usePokemonDexDetailsContext();

  const [abilityNames, setAbilityNames] = useState<string[]>([]);

  const { data } = useAbiltiesDetails(abilityNames, {
    generation: selectedGeneration.value,
  });

  useEffect(() => {
    if (!pokemon.value) return;

    setAbilityNames(
      [
        pokemon.value.abilities[0],
        pokemon.value.abilities[1],
        pokemon.value.abilities.S,
        pokemon.value.abilities.H,
      ].filter((ability) => typeof ability === 'string')
    );
  }, [pokemon.value]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abilities</CardTitle>
        <CardDescription>Special abilities of this Pokémon</CardDescription>
      </CardHeader>
      <CardContent>
        {selectedGeneration.value < 3 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
            <div className="mb-4 rounded-full bg-muted p-3">
              <Info className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mb-1 text-lg font-medium">No Ability Data</h3>
            <p className="text-center text-muted-foreground">
              Abilities were introduced in Generation 3 (Ruby/Sapphire).
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data?.map(
              (ability, index) =>
                ability && (
                  <div key={index} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="font-medium">{ability.name}</h4>
                      <div className="flex items-center gap-2">
                        {index === data.length - 1 &&
                          pokemon.value?.abilities.H && (
                            <Badge variant="outline" className="text-xs">
                              Hidden
                            </Badge>
                          )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {ability.desc}
                    </p>
                  </div>
                )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
