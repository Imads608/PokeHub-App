'use client';

import { useUserTeams, useCreateTeam, useDeleteTeam } from '../hooks/useTeams';
import { DeleteTeamDialog } from './components/delete-team-dialog';
import { TeamCard } from './components/team-card';
import { TeamListItem } from './components/team-list-item';
import { useTeamViewerFilters } from './context/team-viewer.context';
import type { TeamSortBy } from './context/team-viewer.context.model';
import { useFilteredTeams } from './hooks/useFilteredTeams';
import type { GenerationNum } from '@pkmn/dex';
import { getFormatDisplayName } from '@pokehub/frontend/dex-data-provider';
import { getGenerationsData } from '@pokehub/frontend/pokemon-static-data';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Badge,
} from '@pokehub/frontend/shared-ui-components';
import type { PokemonTeam } from '@pokehub/shared/pokemon-types';
import {
  Filter,
  Plus,
  Search,
  Users,
  LayoutGrid,
  List,
  ArrowUpDown,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

export const TeamViewer = () => {
  const router = useRouter();
  const [teamToDelete, setTeamToDelete] = useState<PokemonTeam | null>(null);

  // Data fetching
  const { data: teams, isLoading, isError } = useUserTeams();
  const createTeamMutation = useCreateTeam();
  const deleteTeamMutation = useDeleteTeam();

  // Filter context
  const {
    searchTerm,
    selectedGeneration,
    selectedFormat,
    sortBy,
    sortOrder,
    viewMode,
    resetFilters,
    hasActiveFilters,
  } = useTeamViewerFilters();

  // Filter and sort teams
  const filteredTeams = useFilteredTeams(teams);

  // Get unique full showdown format IDs from user's teams for the filter dropdown
  const availableFormats = useMemo(() => {
    if (!teams) return [];
    const formatSet = new Set(
      teams.map((team) => getFormatDisplayName(team.generation, team.format))
    );
    return Array.from(formatSet).sort();
  }, [teams]);

  // Handlers
  const handleCreateTeam = useCallback(() => {
    router.push('/team-builder/new');
  }, [router]);

  const handleEditTeam = useCallback(
    (teamId: string) => {
      router.push(`/team-builder/${teamId}`);
    },
    [router]
  );

  const handleDuplicateTeam = useCallback(
    async (team: PokemonTeam) => {
      const duplicatedTeam = await createTeamMutation.mutateAsync({
        name: `${team.name} (Copy)`,
        generation: team.generation,
        format: team.format,
        pokemon: team.pokemon,
      });
      toast.success('Team duplicated', {
        description: `"${duplicatedTeam.name}" has been created`,
      });
      router.push(`/team-builder/${duplicatedTeam.id}`);
    },
    [createTeamMutation, router]
  );

  const handleDeleteTeam = useCallback((team: PokemonTeam) => {
    setTeamToDelete(team);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!teamToDelete?.id) return;

    await deleteTeamMutation.mutateAsync(teamToDelete.id);
    toast.success('Team deleted', {
      description: `"${teamToDelete.name}" has been deleted`,
    });
    setTeamToDelete(null);
  }, [teamToDelete, deleteTeamMutation]);

  const handleGenerationChange = useCallback(
    (value: string) => {
      selectedGeneration.setValue(
        value === 'all' ? 'all' : (Number(value) as GenerationNum)
      );
      // Reset format when generation changes
      selectedFormat.setValue('all');
    },
    [selectedGeneration, selectedFormat]
  );

  const handleSortChange = useCallback(
    (value: string) => {
      sortBy.setValue(value as TeamSortBy);
    },
    [sortBy]
  );

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-16 pt-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Skeleton className="h-10 w-48" />
              <Skeleton className="mt-2 h-5 w-72" />
            </div>
            <Skeleton className="h-11 w-40" />
          </div>
          <Skeleton className="mb-8 h-48 w-full" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div className="min-h-screen bg-background pb-16 pt-20">
        <div className="mx-auto max-w-7xl px-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <h3 className="mb-2 text-2xl font-bold text-destructive">
                Error loading teams
              </h3>
              <p className="mb-6 text-center text-muted-foreground">
                There was a problem loading your teams. Please try again.
              </p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const hasTeams = teams && teams.length > 0;
  const hasResults = filteredTeams.length > 0;

  return (
    <div className="min-h-screen bg-background pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold">My Teams</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your competitive Pokemon teams
            </p>
          </div>
          <Button onClick={handleCreateTeam} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Create New Team
          </Button>
        </div>

        {/* Filters and Search */}
        {hasTeams && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter Teams
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2">
                      Active
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {/* View mode toggle */}
                  <Button
                    variant={viewMode.value === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => viewMode.setValue('grid')}
                    className="h-8 w-8"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span className="sr-only">Grid view</span>
                  </Button>
                  <Button
                    variant={viewMode.value === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => viewMode.setValue('list')}
                    className="h-8 w-8"
                  >
                    <List className="h-4 w-4" />
                    <span className="sr-only">List view</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Search */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search teams..."
                      value={searchTerm.value}
                      onChange={(e) => searchTerm.setValue(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Generation filter */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Generation
                  </label>
                  <Select
                    value={
                      selectedGeneration.value === 'all'
                        ? 'all'
                        : selectedGeneration.value.toString()
                    }
                    onValueChange={handleGenerationChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Generations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Generations</SelectItem>
                      {getGenerationsData().map((gen) => (
                        <SelectItem key={gen.id} value={gen.id.toString()}>
                          {gen.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Format filter */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Format
                  </label>
                  <Select
                    value={selectedFormat.value}
                    onValueChange={(value) => selectedFormat.setValue(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Formats" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Formats</SelectItem>
                      {availableFormats.map((format) => (
                        <SelectItem key={format} value={format}>
                          {format}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Sort By
                  </label>
                  <div className="flex gap-2">
                    <Select
                      value={sortBy.value}
                      onValueChange={handleSortChange}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="updated">Last Updated</SelectItem>
                        <SelectItem value="created">Date Created</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={sortOrder.toggleSortOrder}
                      className="shrink-0"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                      <span className="sr-only">Toggle sort order</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Clear filters */}
              {hasActiveFilters && (
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredTeams.length} of {teams?.length} teams
                  </p>
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Teams Display */}
        {!hasTeams ? (
          // Empty state - no teams at all
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-2xl font-bold">No teams yet</h3>
              <p className="mb-6 text-center text-muted-foreground">
                Create your first competitive Pokemon team to get started
              </p>
              <Button onClick={handleCreateTeam} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Team
              </Button>
            </CardContent>
          </Card>
        ) : !hasResults ? (
          // No results from filters
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Search className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-2xl font-bold">No teams found</h3>
              <p className="mb-6 text-center text-muted-foreground">
                No teams match your current filters. Try adjusting your search
                criteria.
              </p>
              <Button variant="outline" onClick={resetFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : viewMode.value === 'grid' ? (
          // Grid view
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onEdit={handleEditTeam}
                onDuplicate={handleDuplicateTeam}
                onDelete={handleDeleteTeam}
              />
            ))}
          </div>
        ) : (
          // List view
          <div className="flex flex-col gap-2">
            {filteredTeams.map((team) => (
              <TeamListItem
                key={team.id}
                team={team}
                onEdit={handleEditTeam}
                onDuplicate={handleDuplicateTeam}
                onDelete={handleDeleteTeam}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <DeleteTeamDialog
        team={teamToDelete}
        open={!!teamToDelete}
        onOpenChange={(open) => !open && setTeamToDelete(null)}
        onConfirm={confirmDelete}
        isDeleting={deleteTeamMutation.isPending}
      />
    </div>
  );
};
