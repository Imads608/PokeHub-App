import { withAuthRetry } from '../pokehub-api-client';
import { useDeleteAccount } from './use-delete-account';
import { useAuthSession } from '@pokehub/frontend/shared-auth';
import { getFetchClient } from '@pokehub/frontend/shared-data-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { signOut } from 'next-auth/react';
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

jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
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
const mockSignOut = signOut as jest.Mock;

describe('useDeleteAccount', () => {
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
    });

    // Default mock: getFetchClient returns fetchThrowsError
    mockGetFetchClient.mockReturnValue({
      fetchThrowsError: mockFetchThrowsError,
    });

    // Default mock: withAuthRetry passes through to callback
    mockWithAuthRetry.mockImplementation(async (_token, callback) => {
      return callback();
    });

    // Default mock: signOut resolves
    mockSignOut.mockResolvedValue(undefined);

    // Default mock: API returns success
    mockFetchThrowsError.mockResolvedValue({ ok: true, status: 204 });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('authentication', () => {
    it('should throw error when not authenticated (no session)', async () => {
      mockUseAuthSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });

      const { result } = renderHook(() => useDeleteAccount(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync();
        })
      ).rejects.toThrow('Not authenticated');
    });

    it('should throw error when no access token', async () => {
      mockUseAuthSession.mockReturnValue({
        data: { user: mockUser },
        status: 'authenticated',
      });

      const { result } = renderHook(() => useDeleteAccount(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync();
        })
      ).rejects.toThrow('Not authenticated');
    });

    it('should throw error when no user', async () => {
      mockUseAuthSession.mockReturnValue({
        data: { accessToken: mockAccessToken },
        status: 'authenticated',
      });

      const { result } = renderHook(() => useDeleteAccount(), { wrapper });

      await expect(
        act(async () => {
          await result.current.mutateAsync();
        })
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('API calls', () => {
    it('should call API with correct DELETE endpoint', async () => {
      const { result } = renderHook(() => useDeleteAccount(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync();
      });

      expect(mockGetFetchClient).toHaveBeenCalledWith('API');
      expect(mockFetchThrowsError).toHaveBeenCalledWith(
        `/users/${mockUser.id}`,
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        })
      );
    });

    it('should use withAuthRetry wrapper', async () => {
      const { result } = renderHook(() => useDeleteAccount(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync();
      });

      expect(mockWithAuthRetry).toHaveBeenCalledWith(
        mockAccessToken,
        expect.any(Function)
      );
    });
  });

  describe('signOut behavior', () => {
    it('should call signOut with default redirectTo on success', async () => {
      const { result } = renderHook(() => useDeleteAccount(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync();
      });

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: '/login' });
      });
    });

    it('should call signOut with custom redirectTo', async () => {
      const { result } = renderHook(
        () => useDeleteAccount({ redirectTo: '/goodbye' }),
        { wrapper }
      );

      await act(async () => {
        await result.current.mutateAsync();
      });

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: '/goodbye' });
      });
    });

    it('should not call signOut on error', async () => {
      mockFetchThrowsError.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useDeleteAccount(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync();
        } catch {
          // Expected error
        }
      });

      expect(mockSignOut).not.toHaveBeenCalled();
    });
  });

  describe('success handling', () => {
    it('should show toast success with default message', async () => {
      const { toast } = await import('sonner');

      const { result } = renderHook(() => useDeleteAccount(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync();
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Account deleted successfully'
        );
      });
    });

    it('should show toast success with custom message', async () => {
      const { toast } = await import('sonner');

      const { result } = renderHook(
        () => useDeleteAccount({ successMessage: 'Goodbye!' }),
        { wrapper }
      );

      await act(async () => {
        await result.current.mutateAsync();
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Goodbye!');
      });
    });

    it('should call onSuccess callback before signOut', async () => {
      const onSuccess = jest.fn();
      const callOrder: string[] = [];

      onSuccess.mockImplementation(() => callOrder.push('onSuccess'));
      mockSignOut.mockImplementation(async () => {
        callOrder.push('signOut');
      });

      const { result } = renderHook(() => useDeleteAccount({ onSuccess }), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync();
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
        expect(mockSignOut).toHaveBeenCalled();
        expect(callOrder).toEqual(['onSuccess', 'signOut']);
      });
    });
  });

  describe('error handling', () => {
    it('should show toast error with error message', async () => {
      const { toast } = await import('sonner');
      const error = new Error('Server error');
      mockFetchThrowsError.mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteAccount(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync();
        } catch {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Server error');
      });
    });

    it('should call onError callback with error', async () => {
      const error = new Error('Delete failed');
      mockFetchThrowsError.mockRejectedValue(error);

      const onError = jest.fn();
      const { result } = renderHook(() => useDeleteAccount({ onError }), {
        wrapper,
      });

      await act(async () => {
        try {
          await result.current.mutateAsync();
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

      const { result } = renderHook(() => useDeleteAccount(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync();
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

      const { result } = renderHook(() => useDeleteAccount(), { wrapper });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.mutate();
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      // Resolve the promise to clean up
      resolvePromise!({ ok: true, status: 204 });
    });
  });
});
