import { useTeamEditorContext } from '../../context/team-editor.context';
import { SearchableSelect } from './searchable-select';
import type { MoveName, Species } from '@pkmn/dex';
import {
  usePokemonLearnset,
  usePokemonMovesFromLearnset,
} from '@pokehub/frontend/dex-data-provider';
import type { PokemonInTeam } from '@pokehub/frontend/pokemon-types';
import { TabsContent } from '@pokehub/frontend/shared-ui-components';
import { typeColors } from '@pokehub/frontend/shared-utils';
import { Check } from 'lucide-react';

export interface MovesTabProps {
  pokemon: PokemonInTeam;
  species: Species;
}

export const MovesTab = ({ pokemon, species }: MovesTabProps) => {
  const {
    activePokemon: { setMove },
    generation,
  } = useTeamEditorContext();

  // Get Pokemon's learnset
  const { data: learnset, isLoading: isLearnsetLoading } = usePokemonLearnset(
    species.id,
    {
      generation: generation.value,
    }
  );

  // Get available moves from learnset
  const { data: movesData, isLoading: isMovesLoading } =
    usePokemonMovesFromLearnset(species.id, learnset, {
      generation: generation.value,
    });

  const moves = movesData ? Object.values(movesData) : [];
  const isLoading = isLearnsetLoading || isMovesLoading;

  return (
    <TabsContent value="moves" className="space-y-4 py-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <SearchableSelect
            key={index}
            id={`move-${index}`}
            label={`Move ${index + 1}`}
            placeholder="Select move"
            value={pokemon.moves[index]}
            items={moves}
            onValueChange={(value) => setMove(index, value as MoveName)}
            onClear={() => setMove(index, '' as MoveName)}
            dropdownWidth="w-[550px]"
            isLoading={isLoading}
            renderItemContent={(move, isSelected) => (
              <>
                <Check
                  className={`mr-2 h-4 w-4 shrink-0 ${
                    isSelected ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <div className="flex w-full items-center gap-3">
                  <span
                    className={`flex-shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                      typeColors[move.type as keyof typeof typeColors] ||
                      'bg-gray-400 text-white'
                    }`}
                  >
                    {move.type}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1 text-left">
                    <span className="break-words font-medium group-hover:text-accent-foreground">
                      {move.name}
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5">
                        {move.category}
                      </span>
                      {move.basePower > 0 && (
                        <span className="rounded bg-muted px-1.5 py-0.5">
                          {move.basePower} BP
                        </span>
                      )}
                      <span className="rounded bg-muted px-1.5 py-0.5">
                        {move.accuracy === true ? '—' : `${move.accuracy}%`} Acc
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5">
                        {move.pp} PP
                      </span>
                    </div>
                    {(move.shortDesc || move.desc) && (
                      <span className="whitespace-normal break-words text-xs leading-tight text-muted-foreground group-hover:text-accent-foreground">
                        {move.shortDesc || move.desc}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          />
        ))}
      </div>
    </TabsContent>
  );
};
