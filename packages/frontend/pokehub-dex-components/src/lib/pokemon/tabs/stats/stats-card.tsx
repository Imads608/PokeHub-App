import { usePokemonDexDetailsContext } from '../../context/pokemon-dex-details.context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Separator,
} from '@pokehub/frontend/shared-ui-components';

export const StatsCard = () => {
  const {
    selectedForm: { pokemon },
    selectedGeneration,
  } = usePokemonDexDetailsContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Base Stats</CardTitle>
        <CardDescription>The base statistics of this Pokémon</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium">HP</span>
              <span className="text-sm">{pokemon.value?.baseStats.hp}</span>
            </div>
            <Progress
              value={
                pokemon.value ? (pokemon.value.baseStats.hp / 255) * 100 : 0
              }
              className="h-2"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium">Attack</span>
              <span className="text-sm">{pokemon.value?.baseStats.atk}</span>
            </div>
            <Progress
              value={
                pokemon.value ? (pokemon.value.baseStats.atk / 255) * 100 : 0
              }
              className="h-2"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium">Defense</span>
              <span className="text-sm">{pokemon.value?.baseStats.def}</span>
            </div>
            <Progress
              value={
                pokemon.value ? (pokemon.value.baseStats.def / 255) * 100 : 0
              }
              className="h-2"
            />
          </div>
          {selectedGeneration.value > 1 ? (
            <>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">Sp. Attack</span>
                  <span className="text-sm">
                    {pokemon.value?.baseStats.spa}
                  </span>
                </div>
                <Progress
                  value={
                    pokemon.value
                      ? (pokemon.value.baseStats.spa / 255) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">Sp. Defense</span>
                  <span className="text-sm">
                    {pokemon.value?.baseStats.spd}
                  </span>
                </div>
                <Progress
                  value={
                    pokemon.value
                      ? (pokemon.value.baseStats.spd / 255) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>
            </>
          ) : (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium">Special</span>
                <span className="text-sm">{pokemon.value?.baseStats.spa}</span>
              </div>
              <Progress
                value={
                  pokemon.value ? (pokemon.value.baseStats.spa / 255) * 100 : 0
                }
                className="h-2"
              />
            </div>
          )}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium">Speed</span>
              <span className="text-sm">{pokemon.value?.baseStats.spe}</span>
            </div>
            <Progress
              value={
                pokemon.value ? (pokemon.value.baseStats.spe / 255) * 100 : 0
              }
              className="h-2"
            />
          </div>

          <Separator />
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="text-sm">{pokemon.value?.bst}</span>
            </div>
            <Progress
              value={pokemon.value ? (pokemon.value.bst / 1530) * 100 : 0}
              className="h-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
