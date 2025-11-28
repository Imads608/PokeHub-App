import { useTeamEditorContext } from '../../context/team-editor-context/team-editor.context';
import { useTeamValidationContext } from '../../context/team-validation-context/team-validation.context';
import { useTeamChanges } from '../../hooks/useTeamChanges';
import { FormatSelector } from './format-selector';
import type { GenerationNum } from '@pkmn/dex';
import { getGenerationsData } from '@pokehub/frontend/pokemon-static-data';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@pokehub/frontend/shared-ui-components';
import {
  AlertTriangle,
  BarChart3,
  Download,
  Info,
  Loader2,
  Save,
  Shield,
  Upload,
} from 'lucide-react';
import { lazy, Suspense } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

export interface TeamConfigurationSectionProps {
  onOpenTeamAnalysis?: () => void;
}

// Lazy load heavy validation components
const LazyFormatRulesDisplay = lazy(() =>
  import(
    /* webpackPrefetch: true */
    /* webpackChunkName: "team-validation" */
    './format-rules-display'
  ).then((module) => ({
    default: module.FormatRulesDisplay,
  }))
);
const LazyTeamValidationSummary = lazy(() =>
  import(
    /* webpackPrefetch: true */
    /* webpackChunkName: "team-validation" */
    './team-validation-summary'
  ).then((module) => ({
    default: module.TeamValidationSummary,
  }))
);

// Loading fallback for validation summary
const ValidationSummaryFallback = () => (
  <Alert className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
    <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
    <AlertTitle className="text-blue-900 dark:text-blue-100">
      Validating Team...
    </AlertTitle>
    <AlertDescription className="text-blue-700 dark:text-blue-300">
      Checking your team against format rules and restrictions
    </AlertDescription>
  </Alert>
);

// Loading fallback for format rules display
const FormatRulesDisplayFallback = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Shield className="h-5 w-5" />
        Format Rules
      </CardTitle>
      <CardDescription>Loading format restrictions...</CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-5/6" />
    </CardContent>
  </Card>
);

export const TeamConfigurationSection = ({
  onOpenTeamAnalysis,
}: TeamConfigurationSectionProps = {}) => {
  const { teamName, generation, format, teamPokemon, showdownFormatId } =
    useTeamEditorContext();

  const validation = useTeamValidationContext();

  const [showGenerationChangeDialog, setShowGenerationChangeDialog] =
    useState(false);
  const [pendingGeneration, setPendingGeneration] =
    useState<GenerationNum | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Change tracking
  const { hasChanges, markAsSaved } = useTeamChanges({
    teamName: teamName.value,
    generation: generation.value,
    format: format.value,
    pokemon: teamPokemon.value,
  });

  // Get Pokemon names for validation summary
  const pokemonNames = useMemo(() => {
    return teamPokemon.value.map((p) => p.species);
  }, [teamPokemon.value]);

  const handleGenerationChange = useCallback(
    (newGeneration: string) => {
      const gen = parseInt(newGeneration) as GenerationNum;

      // Check if team has any Pokemon
      if (teamPokemon.hasAnyPokemon()) {
        // Show confirmation dialog
        setPendingGeneration(gen);
        setShowGenerationChangeDialog(true);
      } else {
        // No Pokemon, change freely
        generation.setValue(gen);
      }
    },
    [teamPokemon, generation]
  );

  const handleConfirmGenerationChange = useCallback(() => {
    if (pendingGeneration !== null) {
      // Clear the team
      teamPokemon.clearTeam();

      // Change generation
      generation.setValue(pendingGeneration);

      // Show success toast
      toast.success('Team cleared and generation changed', {
        description: `Switched to Generation ${pendingGeneration}`,
      });

      // Close dialog
      setShowGenerationChangeDialog(false);
      setPendingGeneration(null);
    }
  }, [pendingGeneration, teamPokemon, generation]);

  const handleCancelGenerationChange = useCallback(() => {
    setShowGenerationChangeDialog(false);
    setPendingGeneration(null);
  }, []);

  const handleSave = useCallback(async () => {
    // Check if validation is ready
    if (!validation.isReady) {
      toast.error('Please wait for validation to complete');
      return;
    }

    // Validate before saving
    if (!validation.isTeamValid) {
      toast.error('Cannot save team with validation errors');
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Implement actual save to backend
      // For now, just simulate save
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mark as saved
      markAsSaved();

      // Show success message
      toast.success('Team saved successfully!', {
        description: teamName.value || 'Unnamed Team',
      });
    } catch (error) {
      console.error('Error saving team:', error);
      toast.error('Failed to save team', {
        description: 'Please try again',
      });
    } finally {
      setIsSaving(false);
    }
  }, [validation.isReady, validation.isTeamValid, teamName.value, markAsSaved]);

  // Determine button state
  const canSave =
    hasChanges && validation.isReady && validation.isTeamValid && !isSaving;
  const saveButtonTooltip = !hasChanges
    ? 'No changes to save'
    : !validation.isReady
    ? 'Validating team...'
    : !validation.isTeamValid
    ? 'Fix validation errors before saving'
    : undefined;

  return (
    <div className="mb-8 space-y-6">
      <div className="grid gap-6 md:grid-cols-[1fr_auto]">
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" onClick={handleSave} disabled={!canSave}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Team
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  {saveButtonTooltip && (
                    <TooltipContent>{saveButtonTooltip}</TooltipContent>
                  )}
                </Tooltip>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ValidationSummaryFallback />}>
              <LazyTeamValidationSummary
                validationResult={validation.state}
                pokemonNames={pokemonNames}
                isReady={validation.isReady}
              />
            </Suspense>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={teamName.value}
                  onChange={(e) => teamName.setValue(e.target.value)}
                  maxLength={50}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="generation">Generation</Label>
                <Select
                  value={generation.value.toString()}
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
                <FormatSelector
                  generation={generation.value}
                  value={format.value}
                  onValueChange={format.setValue}
                  className="mt-1"
                />
              </div>
            </div>
            {/* Format description will be shown in the FormatSelector dropdown */}
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
              onClick={onOpenTeamAnalysis}
              disabled={!teamPokemon.hasAnyPokemon()}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Analyze Team
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Format Rules Display */}
      <Suspense fallback={<FormatRulesDisplayFallback />}>
        <LazyFormatRulesDisplay
          showdownFormatId={showdownFormatId}
          generation={generation.value}
        />
      </Suspense>

      {/* Generation Change Confirmation Dialog */}
      <Dialog
        open={showGenerationChangeDialog}
        onOpenChange={setShowGenerationChangeDialog}
      >
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <DialogTitle>Change Generation?</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Changing generations will <strong>clear your entire team</strong>.
              All Pokemon, moves, and configurations will be lost.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md bg-muted p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="space-y-1 text-sm">
                <p className="font-medium">Why is this necessary?</p>
                <p className="text-muted-foreground">
                  Pokemon, moves, abilities, and items vary between generations.
                  To ensure accuracy, your team must be rebuilt for the selected
                  generation.
                </p>
              </div>
            </div>
          </div>
          {pendingGeneration && (
            <div className="text-sm">
              <span className="text-muted-foreground">Switching to:</span>{' '}
              <span className="font-medium">
                Generation {pendingGeneration}
              </span>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelGenerationChange}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmGenerationChange}
            >
              Clear Team & Change Generation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
