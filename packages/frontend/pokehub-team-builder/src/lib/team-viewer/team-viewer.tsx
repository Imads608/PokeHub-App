'use client';

import { useTiersStaticData } from '../hooks/useTiersStaticData';
import { getGenerationsData } from '@pokehub/frontend/pokemon-static-data';
import type { BattleTier, BattleFormat } from '@pokehub/shared/pokemon-types';
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
  const { allFormatTier, allTiers, doublesTiers, singlesTiers } =
    useTiersStaticData();

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<BattleFormat | 'All'>(
    'All'
  );

  const [availableTiersList, setAvailableTiersList] =
    useState<(BattleTier<'Singles'> | BattleTier<'Doubles'>)[]>(allTiers);
  const [selectedTier, setSelectedTier] = useState<
    BattleTier<'Singles'> | BattleTier<'Doubles'> | typeof allFormatTier
  >(allFormatTier);

  // Load teams on mount

  // Filter teams based on search and filters

  // Handle create new team
  const handleCreateTeam = () => {
    router.push('/team-builder/new');
  };

  const handleTierChange = (val: string) => {
    if (val === 'all') {
      setSelectedTier(allFormatTier);
      return;
    }
    const tierInfo = allTiers.find((tier) => tier.id === val);
    if (tierInfo) {
      setSelectedTier(tierInfo);
    }
  };

  const handleFormatChange = (val: BattleFormat | 'All') => {
    switch (val) {
      case 'All':
        setAvailableTiersList(allTiers);
        setSelectedTier(allTiers[0]);
        break;
      case 'Singles':
        setAvailableTiersList(singlesTiers);
        setSelectedTier(singlesTiers[0]);
        break;
      case 'Doubles':
        setAvailableTiersList(doublesTiers);
        setSelectedTier(doublesTiers[0]);
        break;
      default:
        break;
    }
    setSelectedFormat(val);
  };

  // Handle edit team
  // const handleEditTeam = (teamId: string) => {
  //   router.push(`/team-builder/${teamId}`);
  // };

  // Handle delete team

  // Confirm delete

  // Get Pokemon count for a team

  // Format date

  // Group teams by tier

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
                  onValueChange={(val) =>
                    handleFormatChange(val as BattleFormat | 'All')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Singles">Singles</SelectItem>
                    <SelectItem value="Doubles">Doubles</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Tier</label>
                <Select
                  value={selectedTier.id}
                  onValueChange={handleTierChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {availableTiersList.map((tier) => (
                      <SelectItem key={tier.id} value={tier.id}>
                        {tier.name}
                      </SelectItem>
                    ))}
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
