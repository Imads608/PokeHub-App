'use client';

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
} from '@pokehub/frontend/shared-ui-components';
import { Filter, Plus, Search, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export const TeamViewer = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');

  // Load teams on mount

  // Filter teams based on search and filters

  // Handle create new team
  const handleCreateTeam = () => {
    router.push('/team-builder/new');
  };

  // Handle edit team
  // const handleEditTeam = (teamId: string) => {
  //   router.push(`/team-builder/${teamId}`);
  // };

  // Handle delete team

  // Confirm delete

  // Get Pokemon count for a team

  // Format date

  return (
    <div className="min-h-screen bg-background pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold">My Teams</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your competitive Pokémon teams
            </p>
          </div>
          <Button onClick={handleCreateTeam} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Create New Team
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search teams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Generation
                </label>
                <Select
                  value={selectedGeneration}
                  onValueChange={setSelectedGeneration}
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
              <div>
                <label className="mb-2 block text-sm font-medium">Format</label>
                <Select
                  value={selectedFormat}
                  onValueChange={setSelectedFormat}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Formats" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Formats</SelectItem>
                    {/* TODO: Add format options from useFormats hook when implementing team filtering */}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teams Display */}
        {
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-2xl font-bold">{'No teams yet'}</h3>
              <p className="mb-6 text-center text-muted-foreground">
                Create your first competitive Pokémon team to get started
              </p>
              {
                <Button onClick={handleCreateTeam} size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Team
                </Button>
              }
            </CardContent>
          </Card>
        }
      </div>
    </div>
  );
};
