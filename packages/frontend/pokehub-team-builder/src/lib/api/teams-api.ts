import {
  getFetchClient,
  FetchApiError,
  type FetchResponse,
} from '@pokehub/frontend/shared-data-provider';
import type {
  CreateTeamDTO,
  UpdateTeamDTO,
  TeamResponseDTO,
} from '@pokehub/shared/pokemon-types';

const TEAMS_ENDPOINT = '/teams';

/**
 * API client functions for teams endpoints
 * All endpoints require authentication via access token
 *
 * These functions return FetchResponse to be compatible with withAuthRetry
 */

/**
 * Create a new team - returns FetchResponse for withAuthRetry compatibility
 */
export function createTeamRequest(
  accessToken: string,
  data: CreateTeamDTO
): Promise<FetchResponse<TeamResponseDTO>> {
  return getFetchClient('API').fetchThrowsError<TeamResponseDTO>(TEAMS_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
}

/**
 * Get all teams for the authenticated user
 * Use this in React Server Components
 */
export async function getUserTeams(
  accessToken: string
): Promise<TeamResponseDTO[]> {
  const response = await getFetchClient('API').fetchThrowsError<TeamResponseDTO[]>(
    TEAMS_ENDPOINT,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.json();
}

/**
 * Get a specific team by ID
 * Use this in React Server Components
 */
export async function getTeamById(
  accessToken: string,
  teamId: string
): Promise<TeamResponseDTO> {
  const response = await getFetchClient('API').fetchThrowsError<TeamResponseDTO>(
    `${TEAMS_ENDPOINT}/${teamId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.json();
}

/**
 * Update a team (full replacement) - returns FetchResponse for withAuthRetry compatibility
 */
export function updateTeamRequest(
  accessToken: string,
  teamId: string,
  data: UpdateTeamDTO
): Promise<FetchResponse<TeamResponseDTO>> {
  return getFetchClient('API').fetchThrowsError<TeamResponseDTO>(
    `${TEAMS_ENDPOINT}/${teamId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    }
  );
}

/**
 * Delete a team - returns FetchResponse for withAuthRetry compatibility
 */
export function deleteTeamRequest(
  accessToken: string,
  teamId: string
): Promise<FetchResponse<void>> {
  return getFetchClient('API').fetchThrowsError<void>(`${TEAMS_ENDPOINT}/${teamId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export { FetchApiError };
