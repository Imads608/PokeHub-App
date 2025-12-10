'use client';

import {
  createTeamRequest,
  updateTeamRequest,
  deleteTeamRequest,
} from '../api/teams-api';
import { withAuthRetry } from '@pokehub/frontend/pokehub-data-provider';
import { useAuthSession } from '@pokehub/frontend/shared-auth';
import type { FetchApiError } from '@pokehub/frontend/shared-data-provider';
import type {
  CreateTeamDTO,
  UpdateTeamDTO,
  TeamResponseDTO,
} from '@pokehub/shared/pokemon-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Query keys for teams cache
 */
export const teamsKeys = {
  all: ['teams'] as const,
  detail: (id: string) => ['teams', 'detail', id] as const,
};

/**
 * Hook to create a new team
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();
  const { data: session } = useAuthSession();

  return useMutation({
    mutationFn: async (data: CreateTeamDTO): Promise<TeamResponseDTO> => {
      const { accessToken } = session || {};
      if (!accessToken) {
        throw new Error('Access token is required');
      }
      const response = await withAuthRetry(accessToken, (token) =>
        createTeamRequest(token, data)
      );
      return response.json();
    },
    onSuccess: (newTeam) => {
      queryClient.invalidateQueries({ queryKey: teamsKeys.all });
      queryClient.setQueryData(teamsKeys.detail(newTeam.id), newTeam);
    },
    onError: (error: FetchApiError) => {
      toast.error('Failed to save team', {
        description: error.message || 'Please try again',
      });
    },
  });
}

/**
 * Hook to update an existing team
 */
export function useUpdateTeam() {
  const queryClient = useQueryClient();
  const { data: session } = useAuthSession();

  return useMutation({
    mutationFn: async ({
      teamId,
      data,
    }: {
      teamId: string;
      data: UpdateTeamDTO;
    }): Promise<TeamResponseDTO> => {
      const { accessToken } = session || {};
      if (!accessToken) {
        throw new Error('Access token is required');
      }
      const response = await withAuthRetry(accessToken, (token) =>
        updateTeamRequest(token, teamId, data)
      );
      return response.json();
    },
    onSuccess: (updatedTeam, { teamId }) => {
      queryClient.setQueryData(teamsKeys.detail(teamId), updatedTeam);
      queryClient.invalidateQueries({ queryKey: teamsKeys.all });
    },
    onError: (error: FetchApiError) => {
      console.error('Error updating team in Hook:', error);
      toast.error('Failed to save team', {
        description: error.message || 'Please try again',
      });
    },
  });
}

/**
 * Hook to delete a team
 */
export function useDeleteTeam() {
  const queryClient = useQueryClient();
  const { data: session } = useAuthSession();

  return useMutation({
    mutationFn: async (teamId: string): Promise<void> => {
      const { accessToken } = session || {};
      if (!accessToken) {
        throw new Error('Access token is required');
      }
      await withAuthRetry(accessToken, (token) =>
        deleteTeamRequest(token, teamId)
      );
    },
    onSuccess: (_, teamId) => {
      queryClient.removeQueries({ queryKey: teamsKeys.detail(teamId) });
      queryClient.invalidateQueries({ queryKey: teamsKeys.all });
    },
  });
}

/**
 * Combined hook for save operations (create or update)
 * Automatically determines whether to create or update based on teamId
 */
export function useSaveTeam(teamId: string | undefined) {
  const createMutation = useCreateTeam();
  const updateMutation = useUpdateTeam();

  const isUpdate = !!teamId;
  const activeMutation = isUpdate ? updateMutation : createMutation;

  const saveTeam = async (data: CreateTeamDTO): Promise<TeamResponseDTO> => {
    if (isUpdate) {
      return updateMutation.mutateAsync({ teamId, data });
    }
    return createMutation.mutateAsync(data);
  };

  return {
    saveTeam,
    isPending: activeMutation.isPending,
    isError: activeMutation.isError,
    error: activeMutation.error,
    isSuccess: activeMutation.isSuccess,
    reset: activeMutation.reset,
  };
}
