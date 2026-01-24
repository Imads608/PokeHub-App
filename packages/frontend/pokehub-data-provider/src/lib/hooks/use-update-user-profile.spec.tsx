import { withAuthRetry } from '../pokehub-api-client';
import { useUpdateUserProfile } from './use-update-user-profile';
import { useAuthSession } from '@pokehub/frontend/shared-auth';
import { getFetchClient } from '@pokehub/frontend/shared-data-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';

// Mock dependencies
jest.mock('@pokehub/frontend/shared-auth', () => ({
  useAuthSession: jest.fn(),
}));

jest.mock('@pokehub/frontend/shared-data-provider', () => ({
  getFetchClient: jest.fn(),
}));

jest.mock('../pokehub-api-client', () => ({
  withAuthRetry: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUseAuthSession = useAuthSession as jest.Mock;
const mockGetFetchClient = getFetchClient as jest.Mock;
const mockWithAuthRetry = withAuthRetry as jest.Mock;

describe('useUpdateUserProfile', () => {
  let queryClient: QueryClient;

  const mockAccessToken = 'mock-access-token';
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    avatarUrl: 'https://example.com/avatar.png',
    accountRole: 'USER',
    accountType: 'GOOGLE',
  };

  const mockSession = {
    accessToken: mockAccessToken,
    user: mockUser,
  };

  const mockFetchThrowsError = jest.fn();
  const mockUpdateSession = jest.fn();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    jest.clearAllMocks();

    // Default mock: authenticated session
    mockUseAuthSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: mockUpdateSession,
    });

    // Default mock: getFetchClient returns fetchThrowsError
    mockGetFetchClient.mockReturnValue({
      fetchThrowsError: mockFetchThrowsError,
    });

    // Default mock: withAuthRetry passes through to callback
    mockWithAuthRetry.mockImplementation(async (_token, callback) => {
      return callback();
    });

    // Default mock: updateSession resolves
    mockUpdateSession.mockResolvedValue(undefined);
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('authentication', () => {
    it('should throw error when not authenticated (no session)', async () => {
      mockUseAuthSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: mockUpdateSession,
      });

      const { result } = renderHook(() => useUpdateUserProfile(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync({ username: 'newuser' });
        })
      ).rejects.toThrow('Not authenticated');
    });

    it('should throw error when no access token', async () => {
      mockUseAuthSession.mockReturnValue({
        data: { user: mockUser },
        status: 'authenticated',
        update: mockUpdateSession,
      });

      const { result } = renderHook(() => useUpdateUserProfile(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync({ username: 'newuser' });
        })
      ).rejects.toThrow('Not authenticated');
    });

    it('should throw error when no user', async () => {
      mockUseAuthSession.mockReturnValue({
        data: { accessToken: mockAccessToken },
        status: 'authenticated',
        update: mockUpdateSession,
      });

      const { result } = renderHook(() => useUpdateUserProfile(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync({ username: 'newuser' });
        })
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('API calls', () => {
    it('should call API with correct endpoint and username', async () => {
      const mockResponse = { username: 'newusername' };
      mockFetchThrowsError.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useUpdateUserProfile(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ username: 'newusername' });
      });

      expect(mockGetFetchClient).toHaveBeenCalledWith('API');
      expect(mockFetchThrowsError).toHaveBeenCalledWith(
        `/users/${mockUser.id}/profile`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
          body: JSON.stringify({ username: 'newusername' }),
        })
      );
    });

    it('should map avatarFileName to avatar in request body', async () => {
      const mockResponse = {
        avatar: 'https://storage.example.com/avatars/user-123/avatar.png',
      };
      mockFetchThrowsError.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useUpdateUserProfile(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ avatarFileName: 'myavatar.png' });
      });

      expect(mockFetchThrowsError).toHaveBeenCalledWith(
        `/users/${mockUser.id}/profile`,
        expect.objectContaining({
          body: JSON.stringify({ avatar: 'myavatar.png' }),
        })
      );
    });

    it('should send both username and avatar when provided', async () => {
      const mockResponse = {
        username: 'newuser',
        avatar: 'https://storage.example.com/avatar.png',
      };
      mockFetchThrowsError.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useUpdateUserProfile(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          username: 'newuser',
          avatarFileName: 'avatar.png',
        });
      });

      expect(mockFetchThrowsError).toHaveBeenCalledWith(
        `/users/${mockUser.id}/profile`,
        expect.objectContaining({
          body: JSON.stringify({ username: 'newuser', avatar: 'avatar.png' }),
        })
      );
    });

    it('should use withAuthRetry wrapper', async () => {
      const mockResponse = { username: 'newuser' };
      mockFetchThrowsError.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useUpdateUserProfile(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ username: 'newuser' });
      });

      expect(mockWithAuthRetry).toHaveBeenCalledWith(
        mockAccessToken,
        expect.any(Function)
      );
    });
  });

  describe('session updates', () => {
    it('should update session with new username', async () => {
      const mockResponse = { username: 'newusername' };
      mockFetchThrowsError.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useUpdateUserProfile(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ username: 'newusername' });
      });

      expect(mockUpdateSession).toHaveBeenCalledWith({
        ...mockSession,
        user: {
          ...mockUser,
          username: 'newusername',
        },
      });
    });

    it('should update session with new avatarUrl from response', async () => {
      const newAvatarUrl = 'https://storage.example.com/avatars/new-avatar.png';
      const mockResponse = { avatar: newAvatarUrl };
      mockFetchThrowsError.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useUpdateUserProfile(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ avatarFileName: 'avatar.png' });
      });

      expect(mockUpdateSession).toHaveBeenCalledWith({
        ...mockSession,
        user: {
          ...mockUser,
          avatarUrl: newAvatarUrl,
        },
      });
    });

    it('should update both username and avatarUrl when both returned', async () => {
      const newAvatarUrl = 'https://storage.example.com/avatars/new-avatar.png';
      const mockResponse = { username: 'newuser', avatar: newAvatarUrl };
      mockFetchThrowsError.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useUpdateUserProfile(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          username: 'newuser',
          avatarFileName: 'avatar.png',
        });
      });

      expect(mockUpdateSession).toHaveBeenCalledWith({
        ...mockSession,
        user: {
          ...mockUser,
          username: 'newuser',
          avatarUrl: newAvatarUrl,
        },
      });
    });

    it('should handle empty response gracefully', async () => {
      const mockResponse = {};
      mockFetchThrowsError.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useUpdateUserProfile(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ avatarFileName: 'avatar.png' });
      });

      // Should still call updateSession with unchanged user
      expect(mockUpdateSession).toHaveBeenCalledWith({
        ...mockSession,
        user: mockUser,
      });
    });
  });

  describe('success handling', () => {
    it('should show toast success with default message', async () => {
      const { toast } = await import('sonner');
      const mockResponse = { username: 'newuser' };
      mockFetchThrowsError.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useUpdateUserProfile(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ username: 'newuser' });
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Profile updated successfully'
        );
      });
    });

    it('should show toast success with custom message', async () => {
      const { toast } = await import('sonner');
      const mockResponse = { username: 'newuser' };
      mockFetchThrowsError.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(
        () => useUpdateUserProfile({ successMessage: 'Custom success!' }),
        { wrapper }
      );

      await act(async () => {
        await result.current.mutateAsync({ username: 'newuser' });
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Custom success!');
      });
    });

    it('should call onSuccess callback', async () => {
      const mockResponse = { username: 'newuser' };
      mockFetchThrowsError.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const onSuccess = jest.fn();
      const { result } = renderHook(() => useUpdateUserProfile({ onSuccess }), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({ username: 'newuser' });
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('error handling', () => {
    it('should show toast error with error message', async () => {
      const { toast } = await import('sonner');
      const error = new Error('Network error');
      mockFetchThrowsError.mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateUserProfile(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({ username: 'newuser' });
        } catch {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Network error');
      });
    });

    it('should call onError callback with error', async () => {
      const error = new Error('API error');
      mockFetchThrowsError.mockRejectedValue(error);

      const onError = jest.fn();
      const { result } = renderHook(() => useUpdateUserProfile({ onError }), {
        wrapper,
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({ username: 'newuser' });
        } catch {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error);
      });
    });

    it('should set isError state on failure', async () => {
      mockFetchThrowsError.mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useUpdateUserProfile(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({ username: 'newuser' });
        } catch {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('mutation state', () => {
    it('should track isPending state during mutation', async () => {
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetchThrowsError.mockReturnValue(pendingPromise);

      const { result } = renderHook(() => useUpdateUserProfile(), { wrapper });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.mutate({ username: 'newuser' });
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      // Resolve the promise to clean up
      resolvePromise!({
        json: jest.fn().mockResolvedValue({ username: 'newuser' }),
      });
    });

    it('should return response data on success', async () => {
      const mockResponse = { username: 'newuser', avatar: 'https://url.com' };
      mockFetchThrowsError.mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useUpdateUserProfile(), { wrapper });

      let returnedData;
      await act(async () => {
        returnedData = await result.current.mutateAsync({
          username: 'newuser',
        });
      });

      expect(returnedData).toEqual(mockResponse);
    });
  });
});
