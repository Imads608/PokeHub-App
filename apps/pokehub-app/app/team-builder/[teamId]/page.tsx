import {
  TeamEditor,
  TeamEditorProvider,
} from '@pokehub/frontend/pokehub-team-builder';
import { getTeamById } from '@pokehub/frontend/pokehub-team-builder/server';
import { auth } from '@pokehub/frontend/shared-auth/server';
import { FetchApiError } from '@pokehub/frontend/shared-data-provider';
import { getLogger } from '@pokehub/frontend/shared-logger/server';
import type {
  PokemonTeam,
  TeamResponseDTO,
} from '@pokehub/shared/pokemon-types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const logger = getLogger('TeamEditPage');

// UUID v4 format validation
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TeamEditPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const isNewTeam = teamId === 'new';

  // Validate: must be "new" or a valid UUID
  if (!isNewTeam && !UUID_REGEX.test(teamId)) {
    notFound();
  }

  const session = await auth();

  logger.info('Rendering TeamEditPage for teamId: ' + teamId);

  let team: TeamResponseDTO | undefined = undefined;

  // Only fetch team data if editing an existing team
  if (!isNewTeam && session?.accessToken) {
    try {
      logger.info('Fetching team data for teamId: ' + teamId);
      team = await getTeamById(session.accessToken, teamId);
      logger.info('Successfully fetched team data for teamId: ' + teamId);
    } catch (error) {
      // Only show 404 for "not found" errors, rethrow others
      if (error instanceof FetchApiError && error.status === 404) {
        logger.warn('Team not found for teamId: ' + teamId);
        notFound();
      }
      // Rethrow other errors (500, 401, etc.) to show error page
      throw error;
    }
  }

  return (
    <div className="min-h-screen bg-background pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/team-builder"
            className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Teams
          </Link>
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
