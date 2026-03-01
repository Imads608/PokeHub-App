'use client';

import { useBattleSocketContext } from '../../context/battle-socket.context';
import { QueueStatus } from './queue-status';
import { TeamSelector } from './team-selector';
import { useUserTeams } from '@pokehub/frontend/pokehub-team-builder';
import { getShowdownFormatId } from '@pokehub/frontend/dex-data-provider';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@pokehub/frontend/shared-ui-components';
import { Swords } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export function BattleLobby() {
  const { state, connected, joinQueue, leaveQueue } =
    useBattleSocketContext();
  const { data: teams, isLoading: teamsLoading } = useUserTeams();
  const router = useRouter();

  const [selectedTeamId, setSelectedTeamId] = useState('');

  // Derive the selected team object
  const selectedTeam = useMemo(
    () => teams?.find((t) => t.id === selectedTeamId),
    [teams, selectedTeamId]
  );

  // Navigate to battle page when match starts
  useEffect(() => {
    if (state.phase === 'battle' && state.battleId) {
      router.push(`/battle/${state.battleId}`);
    }
  }, [state.phase, state.battleId, router]);

  const handleFindBattle = () => {
    if (!selectedTeam) return;
    const showdownFormat = getShowdownFormatId(
      selectedTeam.generation,
      selectedTeam.format
    );
    joinQueue(showdownFormat, selectedTeam.id!);
  };

  // Show queue status when searching
  if (state.phase === 'queued') {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <QueueStatus onCancel={leaveQueue} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show transition when matched or battle is starting
  if (state.phase === 'matched' || state.phase === 'battle') {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Swords className="h-10 w-10 text-primary animate-pulse" />
            <p className="text-xl font-semibold">Match Found!</p>
            {state.opponent && (
              <p className="text-muted-foreground">
                vs {state.opponent.name}
              </p>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              Waiting for battle to start...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Battle</h1>
        <p className="text-muted-foreground">
          Select a team and find an opponent
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select a Team</CardTitle>
          <CardDescription>
            Choose one of your teams to battle with
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {teamsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <TeamSelector
              teams={teams ?? []}
              selectedTeamId={selectedTeamId}
              onTeamSelect={setSelectedTeamId}
            />
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={handleFindBattle}
            disabled={!selectedTeamId || !connected}
          >
            <Swords className="mr-2 h-5 w-5" />
            Find Battle
          </Button>

          {!connected && (
            <p className="text-sm text-center text-muted-foreground">
              Connecting to battle server...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
