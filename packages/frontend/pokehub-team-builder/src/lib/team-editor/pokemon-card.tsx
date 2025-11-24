'use client';

import { useTeamValidationContext } from '../context/team-validation.context';
import type { GenerationNum, TypeName } from '@pkmn/dex';
import { Icons } from '@pkmn/img';
import {
  getAbilityDetails,
  getItemDetails,
  getMoveDetails,
  getNatureDetails,
  getPokemonDetailsByName,
  getStatName,
  getStats,
} from '@pokehub/frontend/dex-data-provider';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@pokehub/frontend/shared-ui-components';
import { typeColors } from '@pokehub/frontend/shared-utils';
import type { PokemonInTeam } from '@pokehub/shared/pokemon-types';
import {
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
} from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';

interface PokemonCardProps {
  pokemon: PokemonInTeam;
  generation: GenerationNum;
  onRemove: () => void;
  onEdit: () => void;
  onEditHover?: () => void;
  isPokemonEditorOpen: boolean;
  index: number;
}

export function PokemonCard({
  pokemon,
  generation,
  onRemove,
  onEdit,
  onEditHover,
  isPokemonEditorOpen,
  index,
}: PokemonCardProps) {
  const validation = useTeamValidationContext();

  // Get validation errors for this Pokemon from context
  const pokemonErrors = useMemo(
    () => validation.getPokemonErrors(index),
    [validation, index]
  );
  const hasErrors = pokemonErrors.length > 0;

  // Data being used
  const [isExpanded, setIsExpanded] = useState(false);

  const icon = useRef(Icons.getPokemon(pokemon.species));
  const itemIcon = useRef(
    pokemon.item ? Icons.getItem(pokemon.item) : undefined
  );

  const [species] = useState(() =>
    getPokemonDetailsByName(pokemon.species, generation)
  );
  const [abilityDetails, setAbilityDetails] = useState(
    () => pokemon.ability && getAbilityDetails(pokemon.ability, generation)
  );
  const [itemDetails, setItemDetails] = useState(
    () => pokemon.item && getItemDetails(pokemon.item, generation)
  );

  const [movesDetails, setMovesDetails] = useState(() =>
    pokemon.moves.map((moveName) =>
      moveName ? getMoveDetails(moveName, generation) : undefined
    )
  );

  const [natureDetails, setNatureDetails] = useState(() =>
    getNatureDetails(pokemon.nature, generation)
  );

  const [statsDetails] = useState(() => {
    const stats = getStats();
    const statNames = stats.map((statId) => getStatName(statId, generation));
    return {
      ids: stats,
      names: statNames,
    };
  });

  const [evs, setEvs] = useState(() =>
    statsDetails.ids.map((statId) => (pokemon.evs ? pokemon.evs[statId] : 0))
  );

  useEffect(() => {
    if (!isPokemonEditorOpen) {
      return;
    }
    const newMovesDetails = pokemon.moves.map((moveName) =>
      moveName ? getMoveDetails(moveName, generation) : undefined
    );
    setMovesDetails(newMovesDetails);
  }, [pokemon.moves, isPokemonEditorOpen]);

  useEffect(() => {
    if (!isPokemonEditorOpen) {
      return;
    }
    setAbilityDetails(getAbilityDetails(pokemon.ability, generation));
  }, [pokemon.ability, isPokemonEditorOpen]);

  useEffect(() => {
    if (!isPokemonEditorOpen) {
      return;
    }
    setItemDetails(getItemDetails(pokemon.item, generation));
  }, [pokemon.item, isPokemonEditorOpen]);

  useEffect(() => {
    if (!isPokemonEditorOpen) {
      return;
    }
    const newNatureDetails = getNatureDetails(pokemon.nature, generation);
    newNatureDetails && setNatureDetails(newNatureDetails);
  }, [pokemon.nature, isPokemonEditorOpen]);

  useEffect(() => {
    if (!isPokemonEditorOpen) {
      return;
    }
    setEvs(
      statsDetails.ids.map((statId) => (pokemon.evs ? pokemon.evs[statId] : 0))
    );
  }, [pokemon.evs, isPokemonEditorOpen]);

  return (
    <Card
      className={`overflow-hidden ${hasErrors ? 'border-destructive' : ''}`}
    >
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              style={{
                ...icon.current.css,
              }}
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-medium">
                  {pokemon.name || pokemon.species}
                </span>
                <span className="text-xs text-muted-foreground">
                  Lv.{pokemon.level}
                </span>
                {hasErrors && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-medium">Validation Errors:</p>
                          <ul className="list-inside list-disc space-y-1 text-sm">
                            {pokemonErrors.map((error, index) => (
                              <li key={index}>{error.message}</li>
                            ))}
                          </ul>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="flex gap-1">
                {species?.types.map((type: string) => (
                  <Badge
                    key={type}
                    className={`${
                      typeColors[type as TypeName]
                    } text-xs capitalize`}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              onMouseEnter={onEditHover}
              onFocus={onEditHover}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onRemove}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-2 pt-0">
        <div className="flex flex-col gap-2">
          {/* Item and Ability */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-muted/50 px-2 py-1">
              <div className="text-xs text-muted-foreground">Ability</div>
              <div className="truncate text-sm" title={pokemon.ability}>
                {pokemon.ability || 'None'}
                {abilityDetails && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-1 h-4 w-4 p-0"
                        >
                          <Info className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        {abilityDetails.desc}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
            <div className="rounded-md bg-muted/50 px-2 py-1">
              <div className="text-xs text-muted-foreground">Item</div>
              <div
                className="flex items-center truncate text-sm"
                title={pokemon.item}
              >
                {pokemon.item && itemIcon && (
                  <span
                    style={{
                      ...itemIcon.current?.css,
                    }}
                  />
                )}
                {pokemon.item || 'None'}
                {itemDetails && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-1 h-4 w-4 p-0"
                        >
                          <Info className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        {itemDetails.desc}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </div>

          {/* Moves */}
          <div className="grid grid-cols-2 gap-2">
            {movesDetails &&
              pokemon.moves.map((move, index: number) => (
                <div key={index} className="rounded-md bg-muted/50 px-2 py-1">
                  <div className="text-xs text-muted-foreground">
                    Move {index + 1}
                  </div>
                  <div
                    className="flex items-center truncate text-sm"
                    title={move || ''}
                  >
                    {movesDetails[index] && (
                      <Badge
                        className={`${
                          typeColors[movesDetails[index].type]
                        } mr-1 h-3 w-3 p-0`}
                        variant="outline"
                      />
                    )}
                    {move || ''}
                    {movesDetails[index] && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-1 h-4 w-4 p-0"
                            >
                              <Info className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="font-medium">{move}</span>
                                <Badge
                                  className={
                                    typeColors[movesDetails[index].type]
                                  }
                                >
                                  {movesDetails[index].type}
                                </Badge>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span>
                                  Power: {movesDetails[index].basePower}
                                </span>
                                <span>
                                  Accuracy: {movesDetails[index].accuracy}
                                </span>
                                <span>PP: {movesDetails[index].pp}</span>
                              </div>
                              <div className="text-xs">
                                {movesDetails[index].desc}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </CardContent>

      {/* Expanded content */}
      {isExpanded && natureDetails && (
        <CardContent className="border-t px-4 py-3">
          <div className="space-y-3">
            <div>
              <div className="mb-1 text-sm font-medium">Nature</div>
              <Badge variant="outline" className="flex items-center">
                {pokemon.nature}
                {
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-1 h-4 w-4 p-0"
                        >
                          <Info className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        {natureDetails.desc}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                }
              </Badge>
            </div>

            <div>
              <div className="mb-1 text-sm font-medium">Stats</div>
              <div className="space-y-1">
                {statsDetails.ids.map((stat, index) => {
                  return (
                    <div
                      key={stat}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-sm">
                          {statsDetails.names[index]}
                        </span>
                        {stat === natureDetails.plus && (
                          <span className="text-xs text-green-500">↑</span>
                        )}
                        {stat === natureDetails.minus && (
                          <span className="text-xs text-red-500">↓</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">
                          {statsDetails.names[index]} EV
                        </div>
                        <div className="w-12 text-right text-sm font-medium">
                          {evs[index]}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
