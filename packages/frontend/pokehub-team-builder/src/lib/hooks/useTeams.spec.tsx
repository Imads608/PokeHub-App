import {
  createTeamRequest,
  updateTeamRequest,
  deleteTeamRequest,
} from '../api/teams-api';
import { teamsKeys } from '../utils/teams-query-keys';
import {
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  useSaveTeam,
} from './useTeams';
import { withAuthRetry } from '@pokehub/frontend/pokehub-data-provider';
import { useAuthSession } from '@pokehub/frontend/shared-auth';
import type {
  CreateTeamDTO,
  TeamResponseDTO,
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
}));

jest.mock('../api/teams-api', () => ({
  createTeamRequest: jest.fn(),
  updateTeamRequest: jest.fn(),
  deleteTeamRequest: jest.fn(),
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
const mockWithAuthRetry = withAuthRetry as jest.Mock;
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
      ).rejects.toThrow('Access token is required');
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
      ).rejects.toThrow('Access token is required');
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
      ).rejects.toThrow('Access token is required');
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
        let savedTeam: TeamResponseDTO | undefined;

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
        let savedTeam: TeamResponseDTO | undefined;

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
});
