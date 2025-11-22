import { useTeamEditorContext } from '../../context/team-editor.context';
import { getStats, getStatName } from '@pokehub/frontend/dex-data-provider';
import type { PokemonInTeam } from '@pokehub/shared/pokemon-types';
import {
  Input,
  Label,
  Progress,
  Slider,
  TabsContent,
} from '@pokehub/frontend/shared-ui-components';
import { useMemo } from 'react';

export interface EVsTabProps {
  pokemon: PokemonInTeam;
}

export const EVsTab = ({ pokemon }: EVsTabProps) => {
  const {
    activePokemon: { setEV },
    generation,
  } = useTeamEditorContext();

  const totalEVs = Object.values(pokemon.evs).reduce((sum, ev) => sum + ev, 0);

  // Get available stats based on generation
  const availableStats = useMemo(() => {
    const stats = getStats(generation.value);

    // Filter out stats that don't exist in this generation
    // (getStatName returns names in square brackets like "[Special Defense]" when they don't exist)
    return stats.filter((statId) => {
      const statName = getStatName(statId, generation.value);
      return !statName.startsWith('[');
    });
  }, [generation.value]);

  return (
    <TabsContent value="evs" className="py-4">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <Label>EV Distribution</Label>
          <div className="text-sm text-muted-foreground">{totalEVs}/510</div>
        </div>
        <div className="mt-1">
          <Progress value={(totalEVs / 510) * 100} className="h-2" />
        </div>
      </div>

      <div className="space-y-4">
        {availableStats.map((statId) => {
          const value = pokemon.evs[statId] || 0;

          return (
            <div key={statId}>
              <div className="flex items-center justify-between">
                <Label htmlFor={`ev-${statId}`}>
                  {getStatName(statId, generation.value)}
                </Label>
                <div className="text-sm">{value}/252</div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Slider
                  id={`ev-${statId}`}
                  value={[value]}
                  min={0}
                  max={252}
                  step={4}
                  onValueChange={(val) => setEV(statId, val[0])}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={value as number}
                  onChange={(e) =>
                    setEV(statId, Number.parseInt(e.target.value) || 0)
                  }
                  className="w-16"
                  min={0}
                  max={252}
                  step={4}
                />
              </div>
            </div>
          );
        })}
      </div>
    </TabsContent>
  );
};
