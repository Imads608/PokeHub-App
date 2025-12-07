import {
  TeamEditor,
  TeamEditorProvider,
} from '@pokehub/frontend/pokehub-team-builder';
import { getTeamById } from '@pokehub/frontend/pokehub-team-builder/server';
import { auth } from '@pokehub/frontend/shared-auth/server';
import type {
  PokemonTeam,
  TeamResponseDTO,
} from '@pokehub/shared/pokemon-types';

export default async function TeamEditPage({
  params,
}: {
  params: { teamId: string };
}) {
  const { teamId } = params;
  const session = await auth();

  let team: TeamResponseDTO | undefined = undefined;

  if (team && session?.user) {
    team = await getTeamById(session.user.id, teamId);
  }

  return (
    <div className="min-h-screen bg-background pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Team Builder</h1>
          <p className="mt-2 text-muted-foreground">
            Build and customize your competitive Pokémon team
          </p>
        </div>
        <TeamEditorProvider
          team={team ? (team as unknown as PokemonTeam) : undefined}
        >
          <TeamEditor />
        </TeamEditorProvider>
      </div>
    </div>
  );
}
