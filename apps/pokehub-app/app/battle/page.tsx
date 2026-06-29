import { BattleGuard, BattleLobby } from '@pokehub/frontend/pokehub-battle-components';
import {
  getUserTeams,
  teamsKeys,
} from '@pokehub/frontend/pokehub-team-builder/server';
import { auth } from '@pokehub/frontend/shared-auth/server';
import { getServerQueryClient } from '@pokehub/frontend/shared-data-provider';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export default async function BattlePage() {
  const session = await auth();
  const queryClient = getServerQueryClient();
  const { accessToken } = session || {};

  if (accessToken) {
    await queryClient.prefetchQuery({
      queryKey: teamsKeys.all,
      queryFn: () => getUserTeams(accessToken),
    });
  }

  return (
    <BattleGuard>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BattleLobby />
      </HydrationBoundary>
    </BattleGuard>
  );
}
