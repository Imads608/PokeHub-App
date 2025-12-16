import {
  TeamViewer,
  TeamViewerProvider,
} from '@pokehub/frontend/pokehub-team-builder';
import {
  getUserTeams,
  teamsKeys,
} from '@pokehub/frontend/pokehub-team-builder/server';
import { auth } from '@pokehub/frontend/shared-auth/server';
import { getServerQueryClient } from '@pokehub/frontend/shared-data-provider';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export default async function TeamBuilderPage() {
  const session = await auth();
  const queryClient = getServerQueryClient();
  const { accessToken } = session || {};

  // Prefetch teams data on server if user is authenticated
  if (accessToken) {
    await queryClient.prefetchQuery({
      queryKey: teamsKeys.all,
      queryFn: () => getUserTeams(accessToken),
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeamViewerProvider>
        <TeamViewer />
      </TeamViewerProvider>
    </HydrationBoundary>
  );
}
