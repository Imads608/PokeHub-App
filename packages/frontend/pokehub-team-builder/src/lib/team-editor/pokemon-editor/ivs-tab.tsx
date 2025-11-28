import { useTeamEditorContext } from '../../context/team-editor-context/team-editor.context';
import { getStats, getStatName } from '@pokehub/frontend/dex-data-provider';
import {
  Button,
  Input,
  Label,
  Slider,
  TabsContent,
} from '@pokehub/frontend/shared-ui-components';
import type { PokemonInTeam } from '@pokehub/shared/pokemon-types';
import { useMemo } from 'react';

export interface IVsTabProps {
  pokemon: PokemonInTeam;
}

export const IVsTab = ({ pokemon }: IVsTabProps) => {
  const {
    activePokemon: { setIV, setValue, value: activePokemon },
    generation,
  } = useTeamEditorContext();

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

  const handleMaxAll = () => {
    if (!activePokemon) return;

    const newIvs = { ...activePokemon.ivs };
    availableStats.forEach((statId) => {
      newIvs[statId] = 31;
    });

    setValue({ ...activePokemon, ivs: newIvs });
  };

  const handleTrickRoom = () => {
    if (!activePokemon) return;

    const newIvs = { ...activePokemon.ivs };
    availableStats.forEach((statId) => {
      newIvs[statId] = statId === 'spe' ? 0 : 31;
    });

    setValue({ ...activePokemon, ivs: newIvs });
  };

  return (
    <TabsContent value="ivs" className="py-4">
      <div className="space-y-4">
        {availableStats.map((statId) => {
          const value = pokemon.ivs[statId] || 0;

          return (
            <div key={statId}>
              <div className="flex items-center justify-between">
                <Label htmlFor={`iv-${statId}`}>
                  {getStatName(statId, generation.value)}
                </Label>
                <div className="text-sm">{value}/31</div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Slider
                  id={`iv-${statId}`}
                  value={[value]}
                  min={0}
                  max={31}
                  step={1}
                  onValueChange={(val) => setIV(statId, val[0])}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={value}
                  onChange={(e) =>
                    setIV(statId, Number.parseInt(e.target.value) || 0)
                  }
                  className="w-16"
                  min={0}
                  max={31}
                  step={1}
                />
              </div>
            </div>
          );
        })}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleMaxAll}>
            Max All
          </Button>
          <Button variant="outline" onClick={handleTrickRoom}>
            Trick Room
          </Button>
        </div>
      </div>
    </TabsContent>
  );
};
