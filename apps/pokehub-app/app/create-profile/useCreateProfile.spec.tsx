import { useCreateProfile } from './useCreateProfile';
import { withAuthRetry } from '@pokehub/frontend/pokehub-data-provider';
import { useAuthSession } from '@pokehub/frontend/shared-auth';
import { getFetchClient } from '@pokehub/frontend/shared-data-provider';
import { isValidAvatarFileName } from '@pokehub/frontend/shared-utils';
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

jest.mock('@pokehub/frontend/shared-data-provider', () => ({
  getFetchClient: jest.fn(),
  FetchApiError: class FetchApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

jest.mock('@pokehub/frontend/shared-utils', () => ({
  isValidAvatarFileName: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUseAuthSession = useAuthSession as jest.Mock;
const mockWithAuthRetry = withAuthRetry as jest.Mock;
const mockGetFetchClient = getFetchClient as jest.Mock;
const mockIsValidAvatarFileName = isValidAvatarFileName as jest.Mock;

describe('useCreateProfile', () => {
  let queryClient: QueryClient;
  const mockAccessToken = 'mock-access-token';
  const mockUserId = 'user-123';
  const mockUpdate = jest.fn();
  const mockFetchThrowsError = jest.fn();

  const createMockFile = (name: string, type = 'image/png'): File => {
    return new File(['mock-content'], name, { type });
  };

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

    // Default mock: authenticated session with access token and user
    mockUseAuthSession.mockReturnValue({
      data: {
        accessToken: mockAccessToken,
        user: { id: mockUserId, email: 'test@test.com' },
      },
      update: mockUpdate,
    });

    // Default mock: getFetchClient returns fetch client with fetchThrowsError
    mockGetFetchClient.mockReturnValue({
      fetchThrowsError: mockFetchThrowsError,
    });

    // Default mock: withAuthRetry passes through to the callback
    mockWithAuthRetry.mockImplementation(async (token, callback) => {
      return callback(token);
    });

    // Default mock: isValidAvatarFileName returns true
    mockIsValidAvatarFileName.mockReturnValue(true);

    // Default mock: successful profile update response
    mockFetchThrowsError.mockResolvedValue({
      json: jest.fn().mockResolvedValue({ username: 'testuser', avatar: null }),
    });

    // Default mock: global fetch for Azure upload
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('profile creation without avatar', () => {
    it('should create profile with username only', async () => {
      mockFetchThrowsError.mockResolvedValue({
        json: jest
          .fn()
          .mockResolvedValue({ username: 'newuser', avatar: null }),
      });

      const { result } = renderHook(() => useCreateProfile(null), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ username: 'newuser' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockWithAuthRetry).toHaveBeenCalledWith(
        mockAccessToken,
        expect.any(Function)
      );
    });

    it('should call API with correct profile data', async () => {
      mockFetchThrowsError.mockResolvedValue({
        json: jest.fn().mockResolvedValue({ username: 'myusername' }),
      });

      const { result } = renderHook(() => useCreateProfile(null), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ username: 'myusername' });
      });

      // Verify the callback passed to withAuthRetry
      const withAuthRetryCallback = mockWithAuthRetry.mock.calls[0][1];
      await withAuthRetryCallback(mockAccessToken);

      expect(mockGetFetchClient).toHaveBeenCalledWith('API');
      expect(mockFetchThrowsError).toHaveBeenCalledWith(
        `/users/${mockUserId}/profile`,
        expect.objectContaining({
          method: 'POST',
          headers: { Authorization: `Bearer ${mockAccessToken}` },
          body: JSON.stringify({ username: 'myusername' }),
        })
      );
    });

    it('should update session after successful profile creation', async () => {
      mockFetchThrowsError.mockResolvedValue({
        json: jest
          .fn()
          .mockResolvedValue({ username: 'newuser', avatar: null }),
      });

      const { result } = renderHook(() => useCreateProfile(null), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ username: 'newuser' });
      });

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            user: expect.objectContaining({
              username: 'newuser',
              avatarUrl: null,
            }),
          })
        );
      });
    });

    it('should show success toast on successful profile creation', async () => {
      const { toast } = await import('sonner');
      mockFetchThrowsError.mockResolvedValue({
        json: jest.fn().mockResolvedValue({ username: 'newuser' }),
      });

      const { result } = renderHook(() => useCreateProfile(null), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ username: 'newuser' });
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Profile was updated successfully'
        );
      });
    });
  });

  describe('profile creation with avatar', () => {
    it('should validate avatar filename before upload', async () => {
      mockIsValidAvatarFileName.mockReturnValue(false);

      const avatarFile = createMockFile('invalid@file.exe');
      const { result } = renderHook(() => useCreateProfile(avatarFile), {
        wrapper,
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({ username: 'testuser' });
        } catch {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockIsValidAvatarFileName).toHaveBeenCalledWith(
        'invalid@file.exe'
      );
    });

    it('should get upload URL from Next.js API', async () => {
      mockFetchThrowsError
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({
            uploadUrl: 'https://azure.blob.storage/upload?sas=token',
          }),
        })
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({
            username: 'testuser',
            avatar: 'https://azure.blob.storage/avatar.png',
          }),
        });

      const avatarFile = createMockFile('avatar.png');
      const { result } = renderHook(() => useCreateProfile(avatarFile), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({ username: 'testuser' });
      });

      expect(mockGetFetchClient).toHaveBeenCalledWith('NEXT_API');
      expect(mockFetchThrowsError).toHaveBeenCalledWith(
        '/api/generate-upload-url',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            fileName: 'avatar.png',
            fileType: 'image/png',
          }),
        })
      );
    });

    it('should upload file to Azure Blob Storage', async () => {
      const uploadUrl = 'https://azure.blob.storage/upload?sas=token';
      mockFetchThrowsError
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({ uploadUrl }),
        })
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({
            username: 'testuser',
            avatar: 'https://azure.blob.storage/avatar.png',
          }),
        });

      const avatarFile = createMockFile('avatar.png', 'image/png');
      const { result } = renderHook(() => useCreateProfile(avatarFile), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({ username: 'testuser' });
      });

      expect(global.fetch).toHaveBeenCalledWith(uploadUrl, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': 'image/png',
        },
        body: avatarFile,
      });
    });

    it('should include avatar filename in profile data', async () => {
      mockFetchThrowsError
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({
            uploadUrl: 'https://azure.blob.storage/upload',
          }),
        })
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({
            username: 'testuser',
            avatar: 'https://azure.blob.storage/avatar.png',
          }),
        });

      const avatarFile = createMockFile('myavatar.png');
      const { result } = renderHook(() => useCreateProfile(avatarFile), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({ username: 'testuser' });
      });

      // Verify the profile API call includes avatar filename
      const withAuthRetryCallback = mockWithAuthRetry.mock.calls[0][1];
      await withAuthRetryCallback(mockAccessToken);

      expect(mockFetchThrowsError).toHaveBeenCalledWith(
        `/users/${mockUserId}/profile`,
        expect.objectContaining({
          body: JSON.stringify({
            username: 'testuser',
            avatar: 'myavatar.png',
          }),
        })
      );
    });

    it('should update session with avatar URL after successful upload', async () => {
      const avatarUrl = 'https://azure.blob.storage/user-123/avatar.png';
      mockFetchThrowsError
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({
            uploadUrl: 'https://azure.blob.storage/upload',
          }),
        })
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({
            username: 'testuser',
            avatar: avatarUrl,
          }),
        });

      const avatarFile = createMockFile('avatar.png');
      const { result } = renderHook(() => useCreateProfile(avatarFile), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({ username: 'testuser' });
      });

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            user: expect.objectContaining({
              username: 'testuser',
              avatarUrl: avatarUrl,
            }),
          })
        );
      });
    });
  });

  describe('error handling', () => {
    it('should show error toast when avatar filename is invalid', async () => {
      const { toast } = await import('sonner');
      mockIsValidAvatarFileName.mockReturnValue(false);

      const avatarFile = createMockFile('bad.exe');
      const { result } = renderHook(() => useCreateProfile(avatarFile), {
        wrapper,
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({ username: 'testuser' });
        } catch {
          // Expected
        }
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid avatar filename');
      });
    });

    it('should show error toast when upload URL request fails', async () => {
      const { toast } = await import('sonner');
      mockFetchThrowsError.mockRejectedValueOnce(
        new Error('Failed to get upload URL')
      );

      const avatarFile = createMockFile('avatar.png');
      const { result } = renderHook(() => useCreateProfile(avatarFile), {
        wrapper,
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({ username: 'testuser' });
        } catch {
          // Expected
        }
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to get upload URL');
      });
    });

    it('should show error toast when Azure upload fails', async () => {
      const { toast } = await import('sonner');
      mockFetchThrowsError.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          uploadUrl: 'https://azure.blob.storage/upload',
        }),
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const avatarFile = createMockFile('avatar.png');
      const { result } = renderHook(() => useCreateProfile(avatarFile), {
        wrapper,
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({ username: 'testuser' });
        } catch {
          // Expected
        }
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to upload avatar');
      });
    });

    it('should show error toast when profile API fails', async () => {
      const { toast } = await import('sonner');
      mockFetchThrowsError.mockRejectedValueOnce(
        new Error('Profile update failed')
      );

      const { result } = renderHook(() => useCreateProfile(null), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({ username: 'testuser' });
        } catch {
          // Expected
        }
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Profile update failed');
      });
    });

    it('should show default error message when error has no message', async () => {
      const { toast } = await import('sonner');
      mockFetchThrowsError.mockRejectedValueOnce({});

      const { result } = renderHook(() => useCreateProfile(null), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({ username: 'testuser' });
        } catch {
          // Expected
        }
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Uh oh. Something went wrong :('
        );
      });
    });
  });

  describe('authentication handling', () => {
    it('should not call API when not authenticated', async () => {
      mockUseAuthSession.mockReturnValue({
        data: null,
        update: mockUpdate,
      });

      const { result } = renderHook(() => useCreateProfile(null), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ username: 'testuser' });
      });

      expect(mockWithAuthRetry).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should not call API when access token is missing', async () => {
      mockUseAuthSession.mockReturnValue({
        data: { user: { id: mockUserId } },
        update: mockUpdate,
      });

      const { result } = renderHook(() => useCreateProfile(null), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ username: 'testuser' });
      });

      expect(mockWithAuthRetry).not.toHaveBeenCalled();
    });
  });
});
