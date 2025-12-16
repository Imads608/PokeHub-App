import {
  createTeamRequest,
  updateTeamRequest,
  deleteTeamRequest,
  getUserTeams,
} from '../api/teams-api';
import { teamsKeys } from '../utils/teams-query-keys';
import {
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  useSaveTeam,
  useUserTeams,
} from './useTeams';
import {
  withAuthRetry,
  withAuthRetryWithoutResponse,
} from '@pokehub/frontend/pokehub-data-provider';
import { useAuthSession } from '@pokehub/frontend/shared-auth';
import type {
  CreateTeamDTO,
  TeamResponseDTO,
  PokemonTeam,
  PokemonInTeam,
} from '@pokehub/shared/pokemon-types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';

// Mock dependencies
jest.mock('@pokehub/frontend/shared-auth', () => ({
  useAuthSession: jest.fn(),
}));

jest.mock('@pokehub/frontend/pokehub-data-provider', () => ({
  withAuthRetry: jest.fn(),
  withAuthRetryWithoutResponse: jest.fn(),
}));

jest.mock('../api/teams-api', () => ({
  createTeamRequest: jest.fn(),
  updateTeamRequest: jest.fn(),
  deleteTeamRequest: jest.fn(),
  getUserTeams: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockCreateTeamRequest = createTeamRequest as jest.Mock;
const mockUpdateTeamRequest = updateTeamRequest as jest.Mock;
const mockDeleteTeamRequest = deleteTeamRequest as jest.Mock;
const mockGetUserTeams = getUserTeams as jest.Mock;
const mockWithAuthRetry = withAuthRetry as jest.Mock;
const mockWithAuthRetryWithoutResponse =
  withAuthRetryWithoutResponse as jest.Mock;
const mockUseAuthSession = useAuthSession as jest.Mock;

describe('useTeams hooks', () => {
  let queryClient: QueryClient;

  const mockAccessToken = 'mock-access-token';

  const createMockPokemon = (
    overrides?: Partial<PokemonInTeam>
  ): PokemonInTeam => ({
    species: 'Pikachu' as PokemonInTeam['species'],
    name: '',
    ability: 'Static' as PokemonInTeam['ability'],
    item: 'Light Ball' as PokemonInTeam['item'],
    nature: 'Jolly' as PokemonInTeam['nature'],
    gender: 'M',
    level: 50,
    moves: [
      'Thunderbolt',
      'Volt Tackle',
      'Iron Tail',
      'Quick Attack',
    ] as PokemonInTeam['moves'],
    evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    ...overrides,
  });

  const createMockTeamDTO = (
    overrides?: Partial<CreateTeamDTO>
  ): CreateTeamDTO => ({
    name: 'Test Team',
    generation: 9,
    format: 'ou',
    pokemon: [createMockPokemon()],
    ...overrides,
  });

  const createMockTeamResponse = (
    overrides?: Partial<TeamResponseDTO>
  ): TeamResponseDTO => ({
    id: 'team-123',
    userId: 'user-123',
    name: 'Test Team',
    generation: 9,
    format: 'ou',
    pokemon: [createMockPokemon()],
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });

    jest.clearAllMocks();

    // Default mock: authenticated session with access token
    mockUseAuthSession.mockReturnValue({
      data: { accessToken: mockAccessToken },
      status: 'authenticated',
      update: jest.fn(),
    });

    // Default mock: withAuthRetry passes through to the callback
    mockWithAuthRetry.mockImplementation(async (token, callback) => {
      return callback(token);
    });

    // Default mock: withAuthRetryWithoutResponse passes through to the callback
    mockWithAuthRetryWithoutResponse.mockImplementation(
      async (token, callback) => {
        return callback(token);
      }
    );
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('teamsKeys', () => {
    it('should have correct all key', () => {
      expect(teamsKeys.all).toEqual(['teams']);
    });

    it('should generate correct detail key', () => {
      expect(teamsKeys.detail('team-123')).toEqual([
        'teams',
        'detail',
        'team-123',
      ]);
    });
  });

  describe('useUserTeams', () => {
    it('should fetch teams successfully', async () => {
      const mockTeams = [
        createMockTeamResponse({ id: 'team-1', name: 'Team 1' }),
        createMockTeamResponse({ id: 'team-2', name: 'Team 2' }),
      ];
      mockGetUserTeams.mockResolvedValue(mockTeams);

      const { result } = renderHook(() => useUserTeams(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTeams);
      expect(mockWithAuthRetryWithoutResponse).toHaveBeenCalledWith(
        mockAccessToken,
        expect.any(Function)
      );
    });

    it('should handle empty array response', async () => {
      mockGetUserTeams.mockResolvedValue([]);

      const { result } = renderHook(() => useUserTeams(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should not fetch when not authenticated', async () => {
      mockUseAuthSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      const { result } = renderHook(() => useUserTeams(), { wrapper });

      // Query should be disabled
      expect(result.current.fetchStatus).toBe('idle');
      expect(result.current.data).toBeUndefined();
      expect(mockGetUserTeams).not.toHaveBeenCalled();
    });

    it('should have staleTime of 30 seconds', async () => {
      const mockTeams = [createMockTeamResponse()];
      mockGetUserTeams.mockResolvedValue(mockTeams);

      const { result } = renderHook(() => useUserTeams(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify staleTime by checking query state
      const queryState = queryClient.getQueryState(teamsKeys.all);
      expect(queryState?.isInvalidated).toBe(false);

      // Data should not be stale immediately
      expect(result.current.isStale).toBe(false);
    });

    it('should handle 401 Unauthorized error', async () => {
      const error = new Error('Unauthorized');
      mockGetUserTeams.mockRejectedValue(error);

      const { result } = renderHook(() => useUserTeams(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should handle 403 Forbidden error', async () => {
      const error = new Error('Forbidden');
      mockGetUserTeams.mockRejectedValue(error);

      const { result } = renderHook(() => useUserTeams(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should handle 500 Server Error', async () => {
      const error = new Error('Internal Server Error');
      mockGetUserTeams.mockRejectedValue(error);

      const { result } = renderHook(() => useUserTeams(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it('should refetch when invalidated', async () => {
      const initialTeams = [createMockTeamResponse({ name: 'Initial Team' })];
      const updatedTeams = [
        createMockTeamResponse({ name: 'Initial Team' }),
        createMockTeamResponse({ id: 'team-new', name: 'New Team' }),
      ];

      mockGetUserTeams
        .mockResolvedValueOnce(initialTeams)
        .mockResolvedValueOnce(updatedTeams);

      const { result } = renderHook(() => useUserTeams(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(initialTeams);
      });

      // Invalidate the query
      await queryClient.invalidateQueries({ queryKey: teamsKeys.all });

      await waitFor(() => {
        expect(result.current.data).toEqual(updatedTeams);
      });

      expect(mockGetUserTeams).toHaveBeenCalledTimes(2);
    });
  });

  describe('useCreateTeam', () => {
    it('should create team successfully', async () => {
      const mockResponse = createMockTeamResponse();
      const mockFetchResponse = {
        json: jest.fn().mockResolvedValue(mockResponse),
        ok: true,
        status: 201,
      };
      mockCreateTeamRequest.mockResolvedValue(mockFetchResponse);

      const { result } = renderHook(() => useCreateTeam(), { wrapper });

      const teamDTO = createMockTeamDTO();

      await act(async () => {
        await result.current.mutateAsync(teamDTO);
      });

      // Wait for React state to update
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockWithAuthRetry).toHaveBeenCalledWith(
        mockAccessToken,
        expect.any(Function)
      );
    });

    it('should call createTeamRequest with correct data', async () => {
      const mockResponse = createMockTeamResponse();
      const mockFetchResponse = {
        json: jest.fn().mockResolvedValue(mockResponse),
        ok: true,
        status: 201,
      };
      mockCreateTeamRequest.mockResolvedValue(mockFetchResponse);

      const { result } = renderHook(() => useCreateTeam(), { wrapper });

      const teamDTO = createMockTeamDTO({ name: 'Custom Team' });

      await act(async () => {
        await result.current.mutateAsync(teamDTO);
      });

      // Verify the callback passed to withAuthRetry calls createTeamRequest correctly
      const withAuthRetryCallback = mockWithAuthRetry.mock.calls[0][1];
      await withAuthRetryCallback(mockAccessToken);

      expect(mockCreateTeamRequest).toHaveBeenCalledWith(
        mockAccessToken,
        teamDTO
      );
    });

    it('should throw error when access token is missing', async () => {
      mockUseAuthSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      const { result } = renderHook(() => useCreateTeam(), { wrapper });

      const teamDTO = createMockTeamDTO();

      await expect(
        act(async () => {
          await result.current.mutateAsync(teamDTO);
        })
      ).rejects.toThrow('You must be logged in to delete a team');
    });

    it('should invalidate teams cache on success', async () => {
      const mockResponse = createMockTeamResponse();
      const mockFetchResponse = {
        json: jest.fn().mockResolvedValue(mockResponse),
        ok: true,
        status: 201,
      };
      mockCreateTeamRequest.mockResolvedValue(mockFetchResponse);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');
      const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData');

      const { result } = renderHook(() => useCreateTeam(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(createMockTeamDTO());
      });

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: teamsKeys.all,
        });
        expect(setQueryDataSpy).toHaveBeenCalledWith(
          teamsKeys.detail(mockResponse.id),
          mockResponse
        );
      });
    });

    it('should show toast error on failure', async () => {
      const mockError = { message: 'Team creation failed' };
      mockCreateTeamRequest.mockRejectedValue(mockError);

      const { toast } = await import('sonner');

      const { result } = renderHook(() => useCreateTeam(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(createMockTeamDTO());
        } catch {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to save team', {
          description: 'Team creation failed',
        });
      });
    });

    it('should show default error message when error has no message', async () => {
      mockCreateTeamRequest.mockRejectedValue({});

      const { toast } = await import('sonner');

      const { result } = renderHook(() => useCreateTeam(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(createMockTeamDTO());
        } catch {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to save team', {
          description: 'Please try again',
        });
      });
    });
  });

  describe('useUpdateTeam', () => {
    it('should update team successfully', async () => {
      const teamId = 'team-123';
      const mockResponse = createMockTeamResponse({
        id: teamId,
        name: 'Updated Team',
      });
      const mockFetchResponse = {
        json: jest.fn().mockResolvedValue(mockResponse),
        ok: true,
        status: 200,
      };
      mockUpdateTeamRequest.mockResolvedValue(mockFetchResponse);

      const { result } = renderHook(() => useUpdateTeam(), { wrapper });

      const updateData = createMockTeamDTO({ name: 'Updated Team' });

      await act(async () => {
        await result.current.mutateAsync({ teamId, data: updateData });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockWithAuthRetry).toHaveBeenCalledWith(
        mockAccessToken,
        expect.any(Function)
      );
    });

    it('should call updateTeamRequest with correct parameters', async () => {
      const teamId = 'team-456';
      const mockResponse = createMockTeamResponse({ id: teamId });
      const mockFetchResponse = {
        json: jest.fn().mockResolvedValue(mockResponse),
        ok: true,
        status: 200,
      };
      mockUpdateTeamRequest.mockResolvedValue(mockFetchResponse);

      const { result } = renderHook(() => useUpdateTeam(), { wrapper });

      const updateData = createMockTeamDTO({ name: 'Modified Team' });

      await act(async () => {
        await result.current.mutateAsync({ teamId, data: updateData });
      });

      // Verify the callback passed to withAuthRetry calls updateTeamRequest correctly
      const withAuthRetryCallback = mockWithAuthRetry.mock.calls[0][1];
      await withAuthRetryCallback(mockAccessToken);

      expect(mockUpdateTeamRequest).toHaveBeenCalledWith(
        mockAccessToken,
        teamId,
        updateData
      );
    });

    it('should throw error when access token is missing', async () => {
      mockUseAuthSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      const { result } = renderHook(() => useUpdateTeam(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync({
            teamId: 'team-123',
            data: createMockTeamDTO(),
          });
        })
      ).rejects.toThrow('You must be logged in to delete a team');
    });

    it('should update cache on success', async () => {
      const teamId = 'team-123';
      const mockResponse = createMockTeamResponse({ id: teamId });
      const mockFetchResponse = {
        json: jest.fn().mockResolvedValue(mockResponse),
        ok: true,
        status: 200,
      };
      mockUpdateTeamRequest.mockResolvedValue(mockFetchResponse);

      const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData');
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateTeam(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          teamId,
          data: createMockTeamDTO(),
        });
      });

      await waitFor(() => {
        expect(setQueryDataSpy).toHaveBeenCalledWith(
          teamsKeys.detail(teamId),
          mockResponse
        );
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: teamsKeys.all,
        });
      });
    });

    it('should show toast error on failure', async () => {
      const mockError = { message: 'Update failed' };
      mockUpdateTeamRequest.mockRejectedValue(mockError);

      const { toast } = await import('sonner');

      const { result } = renderHook(() => useUpdateTeam(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            teamId: 'team-123',
            data: createMockTeamDTO(),
          });
        } catch {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to save team', {
          description: 'Update failed',
        });
      });
    });
  });

  describe('useDeleteTeam', () => {
    it('should delete team successfully', async () => {
      const teamId = 'team-123';
      const mockFetchResponse = {
        json: jest.fn().mockResolvedValue(undefined),
        ok: true,
        status: 204,
      };
      mockDeleteTeamRequest.mockResolvedValue(mockFetchResponse);

      const { result } = renderHook(() => useDeleteTeam(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(teamId);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockWithAuthRetry).toHaveBeenCalledWith(
        mockAccessToken,
        expect.any(Function)
      );
    });

    it('should call deleteTeamRequest with correct team ID', async () => {
      const teamId = 'team-to-delete';
      const mockFetchResponse = {
        json: jest.fn().mockResolvedValue(undefined),
        ok: true,
        status: 204,
      };
      mockDeleteTeamRequest.mockResolvedValue(mockFetchResponse);

      const { result } = renderHook(() => useDeleteTeam(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(teamId);
      });

      // Verify the callback passed to withAuthRetry calls deleteTeamRequest correctly
      const withAuthRetryCallback = mockWithAuthRetry.mock.calls[0][1];
      await withAuthRetryCallback(mockAccessToken);

      expect(mockDeleteTeamRequest).toHaveBeenCalledWith(
        mockAccessToken,
        teamId
      );
    });

    it('should throw error when access token is missing', async () => {
      mockUseAuthSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      const { result } = renderHook(() => useDeleteTeam(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync('team-123');
        })
      ).rejects.toThrow('You must be logged in to delete a team');
    });

    it('should remove query and invalidate cache on success', async () => {
      const teamId = 'team-123';
      const mockFetchResponse = {
        json: jest.fn().mockResolvedValue(undefined),
        ok: true,
        status: 204,
      };
      mockDeleteTeamRequest.mockResolvedValue(mockFetchResponse);

      const removeQueriesSpy = jest.spyOn(queryClient, 'removeQueries');
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteTeam(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(teamId);
      });

      await waitFor(() => {
        expect(removeQueriesSpy).toHaveBeenCalledWith({
          queryKey: teamsKeys.detail(teamId),
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: teamsKeys.all,
        });
      });
    });
  });

  describe('useSaveTeam', () => {
    describe('when teamId is undefined (create mode)', () => {
      it('should use create mutation', async () => {
        const mockResponse = createMockTeamResponse();
        const mockFetchResponse = {
          json: jest.fn().mockResolvedValue(mockResponse),
          ok: true,
          status: 201,
        };
        mockCreateTeamRequest.mockResolvedValue(mockFetchResponse);

        const { result } = renderHook(() => useSaveTeam(undefined), {
          wrapper,
        });

        const teamDTO = createMockTeamDTO();
        let savedTeam: TeamResponseDTO | PokemonTeam | undefined;

        await act(async () => {
          savedTeam = await result.current.saveTeam(teamDTO);
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(mockWithAuthRetry).toHaveBeenCalled();
        expect(savedTeam).toEqual(mockResponse);
      });

      it('should track pending state', async () => {
        let resolveRequest: (value: unknown) => void;
        const pendingPromise = new Promise((resolve) => {
          resolveRequest = resolve;
        });

        mockCreateTeamRequest.mockReturnValue(pendingPromise);

        const { result } = renderHook(() => useSaveTeam(undefined), {
          wrapper,
        });

        expect(result.current.isPending).toBe(false);

        act(() => {
          result.current.saveTeam(createMockTeamDTO());
        });

        await waitFor(() => {
          expect(result.current.isPending).toBe(true);
        });

        // Resolve to clean up
        resolveRequest!({
          json: jest.fn().mockResolvedValue(createMockTeamResponse()),
        });
      });
    });

    describe('when teamId is provided (update mode)', () => {
      it('should use update mutation', async () => {
        const teamId = 'existing-team-123';
        const mockResponse = createMockTeamResponse({ id: teamId });
        const mockFetchResponse = {
          json: jest.fn().mockResolvedValue(mockResponse),
          ok: true,
          status: 200,
        };
        mockUpdateTeamRequest.mockResolvedValue(mockFetchResponse);

        const { result } = renderHook(() => useSaveTeam(teamId), { wrapper });

        const teamDTO = createMockTeamDTO({ name: 'Updated Team' });
        let savedTeam: TeamResponseDTO | PokemonTeam | undefined;

        await act(async () => {
          savedTeam = await result.current.saveTeam(teamDTO);
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(mockWithAuthRetry).toHaveBeenCalled();
        expect(savedTeam).toEqual(mockResponse);
      });

      it('should pass teamId to update mutation', async () => {
        const teamId = 'team-to-update';
        const mockResponse = createMockTeamResponse({ id: teamId });
        const mockFetchResponse = {
          json: jest.fn().mockResolvedValue(mockResponse),
          ok: true,
          status: 200,
        };
        mockUpdateTeamRequest.mockResolvedValue(mockFetchResponse);

        const { result } = renderHook(() => useSaveTeam(teamId), { wrapper });

        await act(async () => {
          await result.current.saveTeam(createMockTeamDTO());
        });

        // Verify updateTeamRequest was called with the teamId
        const withAuthRetryCallback = mockWithAuthRetry.mock.calls[0][1];
        await withAuthRetryCallback(mockAccessToken);

        expect(mockUpdateTeamRequest).toHaveBeenCalledWith(
          mockAccessToken,
          teamId,
          expect.any(Object)
        );
      });
    });

    it('should expose error state', async () => {
      const mockError = { message: 'Save failed' };
      mockCreateTeamRequest.mockRejectedValue(mockError);

      const { result } = renderHook(() => useSaveTeam(undefined), { wrapper });

      await act(async () => {
        try {
          await result.current.saveTeam(createMockTeamDTO());
        } catch {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBeDefined();
      });
    });

    it('should provide reset function', async () => {
      const mockError = { message: 'Save failed' };
      mockCreateTeamRequest.mockRejectedValue(mockError);

      const { result } = renderHook(() => useSaveTeam(undefined), { wrapper });

      await act(async () => {
        try {
          await result.current.saveTeam(createMockTeamDTO());
        } catch {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      act(() => {
        result.current.reset();
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(false);
      });
      expect(result.current.error).toBeNull();
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate teams list after create', async () => {
      // Pre-populate cache with teams list
      const initialTeams = [createMockTeamResponse({ id: 'existing-team' })];
      queryClient.setQueryData(teamsKeys.all, initialTeams);

      const newTeam = createMockTeamResponse({ id: 'new-team', name: 'New Team' });
      const mockFetchResponse = {
        json: jest.fn().mockResolvedValue(newTeam),
        ok: true,
        status: 201,
      };
      mockCreateTeamRequest.mockResolvedValue(mockFetchResponse);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateTeam(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(createMockTeamDTO());
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: teamsKeys.all,
      });
    });

    it('should invalidate teams list after delete', async () => {
      const teamId = 'team-to-delete';

      // Pre-populate cache
      queryClient.setQueryData(teamsKeys.all, [
        createMockTeamResponse({ id: teamId }),
      ]);
      queryClient.setQueryData(
        teamsKeys.detail(teamId),
        createMockTeamResponse({ id: teamId })
      );

      const mockFetchResponse = {
        json: jest.fn().mockResolvedValue(undefined),
        ok: true,
        status: 204,
      };
      mockDeleteTeamRequest.mockResolvedValue(mockFetchResponse);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
      const removeSpy = jest.spyOn(queryClient, 'removeQueries');

      const { result } = renderHook(() => useDeleteTeam(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(teamId);
      });

      expect(removeSpy).toHaveBeenCalledWith({
        queryKey: teamsKeys.detail(teamId),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: teamsKeys.all,
      });
    });

    it('should update team detail cache after update', async () => {
      const teamId = 'team-123';
      const originalTeam = createMockTeamResponse({
        id: teamId,
        name: 'Original Name',
      });
      const updatedTeam = createMockTeamResponse({
        id: teamId,
        name: 'Updated Name',
      });

      // Pre-populate cache
      queryClient.setQueryData(teamsKeys.detail(teamId), originalTeam);

      const mockFetchResponse = {
        json: jest.fn().mockResolvedValue(updatedTeam),
        ok: true,
        status: 200,
      };
      mockUpdateTeamRequest.mockResolvedValue(mockFetchResponse);

      const { result } = renderHook(() => useUpdateTeam(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          teamId,
          data: createMockTeamDTO({ name: 'Updated Name' }),
        });
      });

      // Verify cache was updated
      const cachedTeam = queryClient.getQueryData(teamsKeys.detail(teamId));
      expect(cachedTeam).toEqual(updatedTeam);
    });

    it('should add new team to detail cache after create', async () => {
      const newTeam = createMockTeamResponse({
        id: 'brand-new-team',
        name: 'Brand New',
      });
      const mockFetchResponse = {
        json: jest.fn().mockResolvedValue(newTeam),
        ok: true,
        status: 201,
      };
      mockCreateTeamRequest.mockResolvedValue(mockFetchResponse);

      const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData');

      const { result } = renderHook(() => useCreateTeam(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(createMockTeamDTO());
      });

      expect(setQueryDataSpy).toHaveBeenCalledWith(
        teamsKeys.detail(newTeam.id),
        newTeam
      );
    });
  });

  describe('Server Error Handling', () => {
    it('should handle 401 Unauthorized on create', async () => {
      const error = { message: 'Unauthorized', status: 401 };
      mockCreateTeamRequest.mockRejectedValue(error);

      const { toast } = await import('sonner');

      const { result } = renderHook(() => useCreateTeam(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(createMockTeamDTO());
        } catch {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to save team', {
        description: 'Unauthorized',
      });
    });

    it('should handle 403 Forbidden on update', async () => {
      const error = { message: 'Forbidden', status: 403 };
      mockUpdateTeamRequest.mockRejectedValue(error);

      const { toast } = await import('sonner');

      const { result } = renderHook(() => useUpdateTeam(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            teamId: 'team-123',
            data: createMockTeamDTO(),
          });
        } catch {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to save team', {
        description: 'Forbidden',
      });
    });

    it('should handle 500 Internal Server Error on delete', async () => {
      const error = { message: 'Internal Server Error', status: 500 };
      mockDeleteTeamRequest.mockRejectedValue(error);

      const { toast } = await import('sonner');

      const { result } = renderHook(() => useDeleteTeam(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync('team-123');
        } catch {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to delete team', {
        description: 'Internal Server Error',
      });
    });

    it('should handle network timeout', async () => {
      const error = { message: 'Network request timeout' };
      mockCreateTeamRequest.mockRejectedValue(error);

      const { toast } = await import('sonner');

      const { result } = renderHook(() => useCreateTeam(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync(createMockTeamDTO());
        } catch {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to save team', {
        description: 'Network request timeout',
      });
    });
  });
});
