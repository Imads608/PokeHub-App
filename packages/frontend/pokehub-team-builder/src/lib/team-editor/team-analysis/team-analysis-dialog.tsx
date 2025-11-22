'use client';

import { DefensiveCoverageTab } from './defensive-coverage-tab';
import { OffensiveCoverageTab } from './offensive-coverage-tab';
import { TeamSummaryTab } from './team-summary-tab';
import type { GenerationNum, TypeName } from '@pkmn/dex';
import {
  getMoveDetails,
  getPokemonDetailsByName,
} from '@pokehub/frontend/dex-data-provider';
import type { PokemonInTeam } from '@pokehub/shared/pokemon-types';
import {
  calculateTeamDefensiveCoverage,
  calculateTeamOffensiveCoverage,
  getTeamAnalysisSummary,
} from '@pokehub/frontend/pokemon-static-data';
import type {
  MoveForCoverage,
  TeamDefensiveCoverage,
  TeamOffensiveCoverage,
} from '@pokehub/frontend/pokemon-static-data';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@pokehub/frontend/shared-ui-components';
import { useMemo } from 'react';

export interface TeamAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: PokemonInTeam[];
  generation: GenerationNum;
}

export const TeamAnalysisDialog = ({
  open,
  onOpenChange,
  team,
  generation,
}: TeamAnalysisDialogProps) => {
  // Calculate defensive coverage - only when dialog is open
  const defensiveCoverage: TeamDefensiveCoverage | null = useMemo(() => {
    if (!open) return null; // Skip calculation when dialog is closed

    const pokemonWithTypes = team
      .map((pokemon) => {
        const species = getPokemonDetailsByName(pokemon.species, generation);
        // species.types is [TypeName] | [TypeName, TypeName], cast to TypeName[] for the function
        return species ? { types: species.types as TypeName[] } : null;
      })
      .filter((p): p is { types: TypeName[] } => p !== null);

    return calculateTeamDefensiveCoverage(pokemonWithTypes);
  }, [open, team, generation]);

  // Calculate offensive coverage - only when dialog is open
  const offensiveCoverage: TeamOffensiveCoverage | null = useMemo(() => {
    if (!open) return null; // Skip calculation when dialog is closed

    const allMoves: MoveForCoverage[] = [];

    team.forEach((pokemon) => {
      // Get move details for each non-empty move
      pokemon.moves.forEach((moveName) => {
        if (moveName && moveName.trim() !== '') {
          const moveDetails = getMoveDetails(moveName, generation);
          if (moveDetails && moveDetails.exists) {
            allMoves.push({
              type: moveDetails.type,
              category: moveDetails.category,
            });
          }
        }
      });
    });

    return calculateTeamOffensiveCoverage(allMoves);
  }, [open, team, generation]);

  // Calculate summary statistics - only when dialog is open
  const summary = useMemo(() => {
    if (!open || !defensiveCoverage || !offensiveCoverage) return null;

    return getTeamAnalysisSummary(defensiveCoverage, offensiveCoverage);
  }, [open, defensiveCoverage, offensiveCoverage]);

  // Show empty state if no Pokemon
  if (team.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Team Analysis</DialogTitle>
            <DialogDescription>
              Add Pokemon to your team to see analysis
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            <p>Your team is empty. Add at least one Pokemon to analyze.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Team Analysis</DialogTitle>
          <DialogDescription>
            Comprehensive analysis of your team&apos;s strengths, weaknesses, and type
            coverage
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="defensive" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="defensive">Defensive</TabsTrigger>
            <TabsTrigger value="offensive">Offensive</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="defensive" className="space-y-4">
            {defensiveCoverage && (
              <DefensiveCoverageTab
                coverage={defensiveCoverage}
                teamSize={team.length}
              />
            )}
          </TabsContent>

          <TabsContent value="offensive" className="space-y-4">
            {offensiveCoverage && (
              <OffensiveCoverageTab
                coverage={offensiveCoverage}
                teamSize={team.length}
              />
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            {summary && defensiveCoverage && offensiveCoverage && (
              <TeamSummaryTab
                summary={summary}
                defensiveCoverage={defensiveCoverage}
                offensiveCoverage={offensiveCoverage}
                teamSize={team.length}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
