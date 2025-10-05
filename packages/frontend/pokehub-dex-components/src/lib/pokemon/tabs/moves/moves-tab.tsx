import { usePokemonDexDetailsContext } from '../../context/pokemon-dex-details.context';
import type {
  MoveLearnType,
  MoveLearnTypeAbb,
} from '../../models/pokemon-moves.model';
import { MoveLearnTypeMap } from '../../models/pokemon-moves.model';
import { MovesSkeletonLoading } from './moves-skeleton-loading';
import { MovesTableContent } from './moves-table-content';
import type { Move, Species } from '@pkmn/dex';
import {
  usePokemonLearnset,
  usePokemonMovesFromLearnset,
} from '@pokehub/frontend/dex-data-provider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@pokehub/frontend/shared-ui-components';
import { isBaseForme } from '@pokehub/frontend/shared-utils';
import { useEffect, useState } from 'react';

export const PokemonMovesTab = () => {
  const {
    selectedGeneration,
    species,
    selectedForm: { pokemon },
  } = usePokemonDexDetailsContext();
  const baseSpecies = species.value as Species;
  const baseForm =
    pokemon.value && isBaseForme(pokemon.value) ? pokemon.value : baseSpecies;

  const {
    data: learnsetData,
    isError: isLearnsetError,
    isFetching: isLearnsetFetching,
  } = usePokemonLearnset(
    pokemon.value && isBaseForme(pokemon.value)
      ? pokemon.value.id
      : baseSpecies.id,
    { generation: selectedGeneration.value }
  );

  const {
    data: movesData,
    isError: isMovesError,
    isFetching: isMovesFetching,
  } = usePokemonMovesFromLearnset(
    pokemon.value && isBaseForme(pokemon.value)
      ? pokemon.value.id
      : baseSpecies.id,
    learnsetData,
    { generation: selectedGeneration.value }
  );

  const [pokemonMoves, setPokemonMoves] = useState<{
    [name in MoveLearnType]?: { move: Move; levelLearned?: number }[];
  }>({});

  useEffect(() => {
    if (!movesData || !learnsetData) {
      return;
    }
    const moveKeys = Object.keys(movesData);
    const moveSet: {
      [name in MoveLearnType]?: { move: Move; levelLearned?: number }[];
    } = {};

    // Populate the moveSet with moves categorized by learn type
    moveKeys.forEach((move) => {
      const moveLearnset = learnsetData.learnset?.[move];
      const learnTypes = moveLearnset?.filter(
        (val) => val[0] === selectedGeneration.value.toString()
      );
      learnTypes?.forEach((learnType) => {
        const learnTypeName =
          MoveLearnTypeMap[learnType[1] as MoveLearnTypeAbb];
        if (!moveSet[learnTypeName]) {
          moveSet[learnTypeName] = [];
        }
        if (learnTypeName === 'LevelUp') {
          const levelLearned = parseInt(learnType.slice(2), 10);
          moveSet[learnTypeName].push({ move: movesData[move], levelLearned });
        } else {
          moveSet[learnTypeName].push({ move: movesData[move] });
        }
      });
    });

    // Sort each move learn type
    Object.keys(moveSet).forEach((moveLearnType: string) => {
      moveLearnType = moveLearnType as MoveLearnType;
      if (moveLearnType === 'LevelUp') {
        moveSet[moveLearnType]?.sort(
          (a, b) => (a.levelLearned ?? 0) - (b.levelLearned ?? 0)
        );
      } else {
        moveSet[moveLearnType as MoveLearnType]?.sort((a, b) =>
          a.move.name.localeCompare(b.move.name)
        );
      }
    });
    setPokemonMoves(moveSet);
  }, [movesData, learnsetData, selectedGeneration.value]);

  if (isLearnsetFetching || isMovesFetching) {
    return <MovesSkeletonLoading />;
  } else if (isMovesError || isLearnsetError) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center">
        <p className="text-lg font-semibold text-red-500">
          Failed to load data. Please try again.
        </p>
      </div>
    );
  }

  return (
    <TabsContent value="moves" className="mt-6">
      <Card>
        <CardHeader className="flex flex-col items-start">
          <CardTitle>Moves</CardTitle>
          <CardDescription>
            Moves that {baseForm.name} can learn in Generation{' '}
            {selectedGeneration.value}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="levelup">
            <TabsList className="mb-4 w-full">
              {pokemonMoves['LevelUp'] && (
                <TabsTrigger value="levelup">Level Up</TabsTrigger>
              )}
              {pokemonMoves['TM'] && (
                <TabsTrigger value="tm">TM/HM</TabsTrigger>
              )}
              {pokemonMoves['EggMove'] && (
                <TabsTrigger value="egg">Egg Moves</TabsTrigger>
              )}
              {pokemonMoves['Event'] && (
                <TabsTrigger value="event">Event</TabsTrigger>
              )}
              {pokemonMoves['Tutor'] && (
                <TabsTrigger value="tutor">Tutor</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="levelup">
              <ScrollArea className="h-[400px] pr-4">
                <MovesTableContent
                  learnType="LevelUp"
                  pokemonMoves={pokemonMoves['LevelUp']}
                />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="tm">
              <ScrollArea className="h-[400px] pr-4">
                <MovesTableContent
                  learnType="TM"
                  pokemonMoves={pokemonMoves['TM']}
                />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="egg">
              <ScrollArea className="h-[400px] pr-4">
                <MovesTableContent
                  learnType="EggMove"
                  pokemonMoves={pokemonMoves['EggMove']}
                />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="event">
              <ScrollArea className="h-[400px] pr-4">
                <MovesTableContent
                  learnType="Event"
                  pokemonMoves={pokemonMoves['Event']}
                />
              </ScrollArea>
            </TabsContent>
            <TabsContent value="tutor">
              <ScrollArea className="h-[400px] pr-4">
                <MovesTableContent
                  learnType="Tutor"
                  pokemonMoves={pokemonMoves['Tutor']}
                />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </TabsContent>
  );
};
