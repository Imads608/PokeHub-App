import type { EvoChain } from '../../models/evo-chain.model';
import { PokemonCard } from './pokemon-card';
import type { Species } from '@pkmn/dex';
import { ChevronRight, Heart, Moon, Sun } from 'lucide-react';
import type { Pokemon } from 'pokeapi-js-wrapper';
import { useMemo } from 'react';

export type PokemonEvoChain = EvoChain<{ pokeAPI: Pokemon; dex: Species }>;

export interface PokemonEvoTreeProps {
  evolutionChain: PokemonEvoChain;
}

// Helper function to analyze evolution tree structure
const analyzeEvolutionStructure = (node: PokemonEvoChain) => {
  const getMaxDepth = (node: PokemonEvoChain): number => {
    if (!node.evos || node.evos.length === 0) return 1;
    return 1 + Math.max(...node.evos.map(getMaxDepth));
  };

  const getMaxBranching = (node: PokemonEvoChain): number => {
    if (!node.evos || node.evos.length === 0) return 0;
    const currentBranching = node.evos.length;
    const childBranching = Math.max(...node.evos.map(getMaxBranching));
    return Math.max(currentBranching, childBranching);
  };

  const hasMultiStageBranching = (node: PokemonEvoChain): boolean => {
    if (!node.evos || node.evos.length === 0) return false;

    // Check if any evolution has multiple paths
    const hasDirectBranching = node.evos.length > 1;

    // Check if any child has branching (multi-stage branching)
    const hasChildBranching = node.evos.some(
      (evo) => evo.evos && evo.evos.length > 1
    );

    // Return true if there's either direct branching AND child branching, OR just child branching
    return (hasDirectBranching && hasChildBranching) || hasChildBranching;
  };

  const getTotalEvolutions = (node: PokemonEvoChain): number => {
    if (!node.evos || node.evos.length === 0) return 0;
    return (
      node.evos.length +
      node.evos.reduce((sum, evo) => sum + getTotalEvolutions(evo), 0)
    );
  };

  return {
    maxDepth: getMaxDepth(node),
    maxBranching: getMaxBranching(node),
    hasMultiStageBranching: hasMultiStageBranching(node),
    totalEvolutions: getTotalEvolutions(node),
    isLinear: getMaxBranching(node) <= 1,
    isManyBranched: node.evos && node.evos.length > 3,
    hasComplexBranching: hasMultiStageBranching(node),
  };
};

// Helper function to get condition icon
const getConditionIcon = (species: Species) => {
  // switch (type) {
  //   case 'level':
  //     return <span className="text-yellow-500">Lv.</span>;
  //   case 'item':
  //     return <span className="text-blue-500">🔮</span>;
  //   case 'trade':
  //     return <span className="text-green-500">↔️</span>;
  //   case 'friendship':
  //     return <span className="text-pink-500">❤️</span>;
  //   case 'gender':
  //     return <span className="text-purple-500">⚥</span>;
  //   case 'location':
  //     return <span className="text-teal-500">📍</span>;
  //   case 'day':
  //     return <span className="text-yellow-400">☀️</span>;
  //   case 'night':
  //     return <span className="text-indigo-400">🌙</span>;
  //   default:
  //     return <span className="text-gray-500">✨</span>;
  // }
  //

  let message = '';

  if (species.evoType === 'levelFriendship') {
    message += species.evoLevel
      ? `Level up to ${species.evoLevel} with high friendship`
      : 'Level up with high friendship';
  } else if (species.evoType === 'trade') {
    message = 'Trade to evolve';
  } else if (species.evoType === 'useItem') {
    message = `Use ${species.evoItem} to evolve`;
  } else if (species.evoType === 'levelMove') {
    message = species.evoLevel
      ? `Level up to ${species.evoLevel} while knowing ${species.evoMove}`
      : `Level up while knowing ${species.evoMove}`;
  } else if (species.evoType === 'levelHold') {
    message = species.evoLevel
      ? `Level up to ${species.evoLevel} while holding ${species.evoItem}`
      : `Level up while holding ${species.evoItem}`;
  } else if (species.evoType === 'levelExtra') {
    message = `Level up with extra conditions`;
  } else if (species.evoLevel) {
    message = 'Level up to ' + species.evoLevel;
  }
  message += species.evoCondition ? ` ${species.evoCondition}` : '';

  return (
    <>
      <div className="flex items-center gap-1">
        {species.evoType === 'levelFriendship' && <Heart color="red" />}
        {species.evoCondition === 'during the day' && <Sun color="orange" />}
        {species.evoCondition === 'at night' && <Moon color="grey" />}
      </div>
      <div>{message}</div>
    </>
  );
};

export const PokemonEvoTree = ({ evolutionChain }: PokemonEvoTreeProps) => {
  const structure = useMemo(
    () => analyzeEvolutionStructure(evolutionChain),
    [evolutionChain]
  );

  if (structure.isManyBranched) {
    return <ManyBranchedEvolution node={evolutionChain} />;
  } else if (structure.hasComplexBranching) {
    return <ComplexBranchingEvolution node={evolutionChain} />; // Complex branching (A -> B -> [C, D])
  } else if (structure.maxBranching > 1) {
    return <SimpleBranchingEvolution node={evolutionChain} />;
  } else {
    return <LinearEvolution node={evolutionChain} />;
  }
};

// Component for linear evolutions (A -> B -> C)
function LinearEvolution({ node }: { node: PokemonEvoChain }) {
  const flattenLinearChain = (node: PokemonEvoChain): PokemonEvoChain[] => {
    const chain = [node];
    let current = node;

    while (current.evos && current.evos.length === 1) {
      current = current.evos[0];
      chain.push(current);
    }

    return chain;
  };

  const chain = flattenLinearChain(node);

  return (
    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
      {chain.map((pokemon, index) => (
        <div
          key={pokemon.pokemon.dex.id}
          className="flex flex-col items-center sm:flex-row"
        >
          <PokemonCard
            pokemon={pokemon.pokemon.dex}
            pokeAPI={pokemon.pokemon.pokeAPI}
          />

          {index < chain.length - 1 && (
            <div className="my-2 flex flex-row sm:mx-4 sm:my-0 sm:items-center">
              <div className="hidden h-px w-8 bg-muted-foreground/30 sm:block"></div>
              <ChevronRight className="mx-1 h-5 w-5 text-muted-foreground" />
              {
                <div className="flex flex-col items-center justify-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
                  {getConditionIcon(chain[index + 1].pokemon.dex)}
                </div>
              }
              <ChevronRight className="mx-1 h-5 w-5 text-muted-foreground" />
              <div className="hidden h-px w-8 bg-muted-foreground/30 sm:block"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Component for simple branching (one stage branches to multiple)
function SimpleBranchingEvolution({ node }: { node: PokemonEvoChain }) {
  return (
    <div className="flex flex-col items-center">
      {/* Base Pokémon */}
      <PokemonCard pokemon={node.pokemon.dex} pokeAPI={node.pokemon.pokeAPI} />

      {/* Branches */}
      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {node.evos.map((evolution, index) => (
          <div key={index} className="flex flex-col items-center">
            {/* Evolution arrow and condition */}
            <div className="my-2 flex items-center">
              <ChevronRight className="mx-1 h-5 w-5 rotate-90 text-muted-foreground" />
              {
                <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
                  {getConditionIcon(evolution.pokemon.dex)}
                </div>
              }
            </div>

            {/* Evolution Pokémon */}
            <PokemonCard
              pokemon={evolution.pokemon.dex}
              pokeAPI={evolution.pokemon.pokeAPI}
            />

            {/* Further evolutions if any */}
            {evolution.evos && evolution.evos.length > 0 && (
              <div className=" flex flex-col items-center">
                <div className="my-2 flex items-center">
                  <ChevronRight className="mx-1 h-5 w-5 rotate-90 text-muted-foreground" />
                  {evolution.evos[0] && (
                    <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
                      {getConditionIcon(evolution.evos[0].pokemon.dex)}
                    </div>
                  )}
                </div>
                <PokemonCard
                  pokemon={evolution.evos[0].pokemon.dex}
                  pokeAPI={evolution.evos[0].pokemon.pokeAPI}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Component for complex branching (multiple stages with branching)
function ComplexBranchingEvolution({ node }: { node: PokemonEvoChain }) {
  return (
    <div className="w-full">
      {/* Desktop version - horizontal layout */}
      <div className="hidden sm:block">
        <div className="flex flex-col items-center">
          {/* Base Pokémon */}
          <div className="mb-8">
            <PokemonCard
              pokemon={node.pokemon.dex}
              pokeAPI={node.pokemon.pokeAPI}
            />
          </div>

          {/* Check if first stage has single evolution that then branches */}
          {node.evos.length === 1 && node.evos[0].evos.length > 1 ? (
            // Pattern: A -> B -> [C, D] (like Ralts -> Kirlia -> [Gardevoir, Gallade])
            <div className="flex flex-col items-center">
              {/* Middle evolution */}
              <div className="mb-4">
                {
                  <div className="mb-2 flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
                    {getConditionIcon(node.evos[0].pokemon.dex)}
                  </div>
                }
                <ChevronRight className="mb-2 h-5 w-5 rotate-90 text-muted-foreground" />
              </div>

              <div className="mb-8">
                <PokemonCard
                  pokemon={node.evos[0].pokemon.dex}
                  pokeAPI={node.evos[0].pokemon.pokeAPI}
                />
              </div>

              {/* Final branching evolutions */}
              <div className="grid grid-cols-2 gap-x-16 gap-y-4">
                {node.evos[0].evos.map((evolution, index) => (
                  <div key={index} className="flex flex-col items-center">
                    {
                      <div className="mb-2 flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
                        {getConditionIcon(evolution.pokemon.dex)}
                      </div>
                    }
                    <ChevronRight className="mb-2 h-5 w-5 rotate-90 text-muted-foreground" />
                    <PokemonCard
                      pokemon={evolution.pokemon.dex}
                      pokeAPI={evolution.pokemon.pokeAPI}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Pattern: A -> [B -> C, D -> E] (like Wurmple -> [Silcoon -> Beautifly, Cascoon -> Dustox])
            <div className="grid grid-cols-2 gap-x-16 gap-y-4">
              {node.evos.map((branch, branchIndex) => (
                <div key={branchIndex} className="flex flex-col items-center">
                  {/* First evolution condition */}
                  {
                    <div className="mb-2 flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
                      {getConditionIcon(branch.pokemon.dex)}
                    </div>
                  }

                  <ChevronRight className="mb-2 h-5 w-5 rotate-90 text-muted-foreground" />
                  <PokemonCard
                    pokemon={branch.pokemon.dex}
                    pokeAPI={branch.pokemon.pokeAPI}
                  />

                  {/* Second evolution if exists */}
                  {branch.evos && branch.evos.length > 0 && (
                    <div className="mt-4 flex flex-col items-center">
                      {
                        <div className="mb-2 flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
                          {getConditionIcon(branch.evos[0].pokemon.dex)}
                        </div>
                      }
                      <ChevronRight className="mb-2 h-5 w-5 rotate-90 text-muted-foreground" />
                      <PokemonCard
                        pokemon={branch.evos[0].pokemon.dex}
                        pokeAPI={branch.evos[0].pokemon.pokeAPI}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile version - vertical layout */}
      <div className="sm:hidden">
        <div className="flex flex-col items-center">
          <PokemonCard
            pokemon={node.pokemon.dex}
            pokeAPI={node.pokemon.pokeAPI}
          />

          <div className="mt-4 w-full space-y-8">
            {node.evos.length === 1 && node.evos[0].evos.length > 1 ? (
              // Single middle evolution that branches
              <div className="flex flex-col items-center">
                <div className="my-2 flex items-center">
                  <ChevronRight className="mx-1 h-5 w-5 rotate-90 text-muted-foreground" />
                  {
                    <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
                      {getConditionIcon(node.evos[0].pokemon.dex)}
                    </div>
                  }
                </div>

                <PokemonCard
                  pokemon={node.evos[0].pokemon.dex}
                  pokeAPI={node.evos[0].pokemon.pokeAPI}
                />

                <div className="mt-4 w-full space-y-8">
                  {node.evos[0].evos.map((evolution, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center rounded-lg border p-4"
                    >
                      {
                        <div className="mb-2 flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
                          {getConditionIcon(evolution.pokemon.dex)}
                        </div>
                      }
                      <ChevronRight className="mb-2 h-5 w-5 rotate-90 text-muted-foreground" />
                      <PokemonCard
                        pokemon={evolution.pokemon.dex}
                        pokeAPI={evolution.pokemon.pokeAPI}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Multiple branches from base
              node.evos.map((branch, branchIndex) => (
                <div
                  key={branchIndex}
                  className="flex flex-col items-center rounded-lg border p-4"
                >
                  {
                    <div className="mb-2 flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
                      {getConditionIcon(branch.pokemon.dex)}
                    </div>
                  }
                  <ChevronRight className="mb-2 h-5 w-5 rotate-90 text-muted-foreground" />
                  <PokemonCard
                    pokemon={branch.pokemon.dex}
                    pokeAPI={branch.pokemon.pokeAPI}
                  />

                  {branch.evos && branch.evos.length > 0 && (
                    <div className="mt-4 flex w-full flex-col items-center border-t pt-4">
                      {
                        <div className="mb-2 flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
                          {getConditionIcon(branch.evos[0].pokemon.dex)}
                        </div>
                      }
                      <ChevronRight className="mb-2 h-5 w-5 rotate-90 text-muted-foreground" />
                      <PokemonCard
                        pokemon={branch.evos[0].pokemon.dex}
                        pokeAPI={branch.evos[0].pokemon.pokeAPI}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for many branched evolutions (like Eevee)
function ManyBranchedEvolution({ node }: { node: PokemonEvoChain }) {
  return (
    <div className="flex flex-col items-center">
      {/* Base Pokémon */}
      <div className="mb-6">
        <PokemonCard
          pokemon={node.pokemon.dex}
          pokeAPI={node.pokemon.pokeAPI}
        />
      </div>

      {/* Evolution branches in a responsive grid */}
      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {node.evos.map((evolution, index) => (
          <div
            key={index}
            className="flex flex-col items-center rounded-lg border bg-background/50 p-4"
          >
            {/* Evolution condition */}
            {
              <div className="mb-3 flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
                {getConditionIcon(evolution.pokemon.dex)}
              </div>
            }

            {/* Arrow */}
            <ChevronRight className="mb-2 h-6 w-6 rotate-90 text-muted-foreground" />

            {/* Evolution Pokémon */}
            <PokemonCard
              pokemon={evolution.pokemon.dex}
              pokeAPI={evolution.pokemon.pokeAPI}
            />

            {/* Further evolutions */}
            {evolution.evos && evolution.evos.length > 0 && (
              <div className="mt-3 w-full border-t pt-3">
                <div className="flex flex-col items-center">
                  {
                    <div className="mb-2 flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">
                      {getConditionIcon(evolution.evos[0].pokemon.dex)}
                    </div>
                  }
                  <ChevronRight className="mb-2 h-5 w-5 rotate-90 text-muted-foreground" />
                  <div className="scale-90">
                    <PokemonCard
                      pokemon={evolution.evos[0].pokemon.dex}
                      pokeAPI={evolution.evos[0].pokemon.pokeAPI}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
