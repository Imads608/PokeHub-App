'use client';

import { useTiersStaticData } from '../hooks/useTiersStaticData';
import { EmptySlot } from './empty-slot';
import { PokemonCard } from './pokemon-card';
import { PokemonSelector } from './pokemon-selector';
import { useLoadPokemonTeam } from '@pokehub/frontend/pokehub-data-provider';
import {
  type GenerationDetails,
  getBattleTiersForFormat,
  getGenerationsData,
} from '@pokehub/frontend/pokemon-static-data';
import type {
  BattleFormat,
  BattleTier,
  PokemonInTeam,
} from '@pokehub/frontend/pokemon-types';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@pokehub/frontend/shared-ui-components';
import { BarChart3, Download, Info, Save, Upload } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useState } from 'react';

export const TeamEditor = () => {
  const { singlesTiers, doublesTiers } = useTiersStaticData();

  const params = useParams();
  const teamId = params.teamId as string;

  useLoadPokemonTeam(teamId, { enabled: teamId !== 'new' });

  // State for team configuration
  const [teamName, setTeamName] = useState('My Team');
  const [selectedGeneration, setSelectedGeneration] =
    useState<GenerationDetails>(
      getGenerationsData()[getGenerationsData().length - 1]
    );
  const [selectedFormat, setSelectedFormat] = useState<BattleFormat>('Singles');
  const [selectedFormatTiers, setSelectedFormatTiers] = useState<
    BattleTier<'Singles'>[] | BattleTier<'Doubles'>[]
  >(selectedFormat === 'Singles' ? singlesTiers : doublesTiers);
  const [selectedTier, setSelectedTier] = useState<
    BattleTier<'Singles'> | BattleTier<'Doubles'>
  >(getBattleTiersForFormat(selectedFormat)[0]);
  const [team] = useState<(PokemonInTeam | undefined)[]>([
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  ]);
  const [, setIsTeamAnalysisOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | undefined>(1);
  const [isPokemonSelectorOpen, setIsPokemonSelectorOpen] = useState(false);

  const handleTierChange = useCallback(
    (tierId: string) => {
      const foundTier = selectedFormatTiers.find(
        (currTier) => currTier.id === tierId
      );
      foundTier && setSelectedTier(foundTier);
    },
    [selectedFormatTiers]
  );

  const handleFormatChange = useCallback((val: BattleFormat) => {
    setSelectedFormat(val);
    setSelectedFormatTiers(val === 'Singles' ? singlesTiers : doublesTiers);
    setSelectedTier(val === 'Singles' ? singlesTiers[0] : doublesTiers[0]);
  }, []);

  const handleGenerationChange = useCallback((value: string) => {
    const generations = getGenerationsData();
    const index = generations.findIndex((gen) => gen.id.toString() === value);
    const generation = generations[index];
    setSelectedGeneration(generation);
  }, []);

  return (
    <>
      {/* Team Configuration */}
      <div className="mb-8 grid gap-6 md:grid-cols-[1fr_auto]">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Team Configuration</CardTitle>
                <CardDescription>
                  Set up your team format and rules
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Implement Export')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
                <Button size="sm" onClick={() => console.log('Implement Save')}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Team
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="generation">Generation</Label>
                <Select
                  value={selectedGeneration.id.toString()}
                  onValueChange={handleGenerationChange}
                >
                  <SelectTrigger id="generation" className="mt-1">
                    <SelectValue placeholder="Select Generation" />
                  </SelectTrigger>
                  <SelectContent>
                    {getGenerationsData().map((gen) => (
                      <SelectItem key={gen.id} value={gen.id.toString()}>
                        {gen.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="format">Format</Label>
                <Select
                  value={selectedFormat}
                  onValueChange={(val) =>
                    handleFormatChange(val as BattleFormat)
                  }
                >
                  <SelectTrigger id="format" className="mt-1">
                    <SelectValue placeholder="Select Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Singles">Singles</SelectItem>
                    <SelectItem value="Doubles">Doubles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tier">Tier</Label>
                <Select
                  value={selectedTier.id}
                  onValueChange={handleTierChange}
                >
                  <SelectTrigger id="tier" className="mt-1">
                    <SelectValue placeholder="Select Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedFormatTiers.map((tier) => (
                      <SelectItem key={tier.id} value={tier.id}>
                        {tier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Format and Tier descriptions */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {selectedFormat && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>{selectedFormat}</AlertTitle>
                  <AlertDescription>
                    {selectedFormat === 'Singles'
                      ? 'Standard 1v1 battles where each trainer brings 6 Pokémon and sends out 1 at a time.'
                      : 'Doubles battles where each trainer brings 4-6 Pokémon and sends out 2 at a time.'}
                  </AlertDescription>
                </Alert>
              )}
              {selectedTier && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>{selectedTier.name}</AlertTitle>
                  <AlertDescription>
                    {selectedTier.description}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Team Analysis</CardTitle>
            <CardDescription>
              {"Check your team's strengths and weaknesses"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsTeamAnalysisOpen(true)}
              disabled={team.every((p) => p === null)}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Analyze Team
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Team Builder */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {team.map((pokemon, index) => (
          <div key={index}>
            {pokemon ? (
              <PokemonCard
                pokemon={pokemon}
                generation={selectedGeneration.id}
                onRemove={() => console.log('implement')}
                onUpdate={(updates) => console.log('implement')}
                onEdit={() => {
                  console.log('implement');
                }}
              />
            ) : (
              <EmptySlot
                index={index}
                onClick={() => {
                  setActiveSlot(index + 1);
                  setIsPokemonSelectorOpen(true);
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* {/* Success Message */}
      {/* {showSuccessMessage && ( */}
      {/*   <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-5"> */}
      {/*     <Alert className="border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300"> */}
      {/*       <Sparkles className="h-4 w-4" /> */}
      {/*       <AlertTitle>Success!</AlertTitle> */}
      {/*       <AlertDescription> */}
      {/*         {teamName} has been saved successfully. */}
      {/*       </AlertDescription> */}
      {/*     </Alert> */}
      {/*   </div> */}
      {/* )} */}
      {/**/}
      {/* Pokémon Selector Dialog */}
      <Dialog
        open={isPokemonSelectorOpen}
        onOpenChange={setIsPokemonSelectorOpen}
      >
        <DialogContent className="sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>Select a Pokémon</DialogTitle>
            <DialogDescription>
              Choose a Pokémon to add to slot {activeSlot ? activeSlot + 1 : ''}
            </DialogDescription>
          </DialogHeader>
          <PokemonSelector
            generation={selectedGeneration.id}
            tier={selectedTier}
          />
        </DialogContent>
      </Dialog>
      {/**/}
      {/* {/* Team Analysis Dialog */}
      {/* <Dialog open={isTeamAnalysisOpen} onOpenChange={setIsTeamAnalysisOpen}> */}
      {/*   <DialogContent className="max-w-4xl"> */}
      {/*     <DialogHeader> */}
      {/*       <DialogTitle>Team Analysis</DialogTitle> */}
      {/*       <DialogDescription> */}
      {/*         Detailed breakdown of your team's strengths and weaknesses */}
      {/*       </DialogDescription> */}
      {/*     </DialogHeader> */}
      {/*     <TeamAnalysis */}
      {/*       team={team.filter((p) => p !== null)} */}
      {/*       typeColors={typeColors} */}
      {/*     /> */}
      {/*   </DialogContent> */}
      {/* </Dialog> */}
      {/* {/* Pokémon Edit Dialog */}
      {/* {activePokemonIndex !== null && team[activePokemonIndex] && ( */}
      {/*   <Dialog open={isEditingPokemon} onOpenChange={setIsEditingPokemon}> */}
      {/*     <DialogContent className="max-w-4xl"> */}
      {/*       <DialogHeader className="flex flex-row items-center gap-2 sm:gap-4"> */}
      {/*         <div className="flex items-center gap-2"> */}
      {/*           <img */}
      {/*             src={ */}
      {/*               team[activePokemonIndex].image || */}
      {/*               `/placeholder.svg?height=60&width=60&text=${team[activePokemonIndex].id}` */}
      {/*             } */}
      {/*             alt={team[activePokemonIndex].name} */}
      {/*             className="h-12 w-12 object-contain sm:h-16 sm:w-16" */}
      {/*           /> */}
      {/*           <div> */}
      {/*             <DialogTitle className="text-xl"> */}
      {/*               {team[activePokemonIndex].nickname || */}
      {/*                 team[activePokemonIndex].name} */}
      {/*             </DialogTitle> */}
      {/*             <div className="mt-1 flex gap-1"> */}
      {/*               {team[activePokemonIndex].types.map((type: string) => ( */}
      {/*                 <Badge */}
      {/*                   key={type} */}
      {/*                   className={`${typeColors[type]} text-xs capitalize`} */}
      {/*                 > */}
      {/*                   {type} */}
      {/*                 </Badge> */}
      {/*               ))} */}
      {/*             </div> */}
      {/*           </div> */}
      {/*         </div> */}
      {/*       </DialogHeader> */}
      {/*       <PokemonEditor */}
      {/*         pokemon={team[activePokemonIndex]} */}
      {/*         onUpdate={(updates) => updatePokemon(activePokemonIndex, updates)} */}
      {/*         onClose={() => setIsEditingPokemon(false)} */}
      {/*         typeColors={typeColors} */}
      {/*       /> */}
      {/*     </DialogContent> */}
      {/*   </Dialog> */}
      {/* )} */}
    </>
  );
};
