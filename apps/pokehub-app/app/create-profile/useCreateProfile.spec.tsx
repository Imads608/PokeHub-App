import { useCreateProfile } from './useCreateProfile';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';

// Mock useUpdateUserProfile
const mockMutateAsync = jest.fn();
jest.mock('@pokehub/frontend/pokehub-data-provider', () => ({
  useUpdateUserProfile: jest.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    isSuccess: false,
  })),
}));

// Mock useAvatarUpload - capture onError callback
const mockUploadAvatar = jest.fn();
const mockHandleFileSelect = jest.fn();
const mockClearSelection = jest.fn();
let capturedOnError: ((error: Error) => void) | undefined;

const mockAvatarState = {
  selectedFile: null as File | null,
  previewUrl: null as string | null,
  error: null as string | null,
};

jest.mock('@pokehub/frontend/pokehub-ui-components', () => ({
  useAvatarUpload: jest.fn((options?: { onError?: (error: Error) => void }) => {
    // Capture the onError callback
    capturedOnError = options?.onError;
    return {
      selectedFile: mockAvatarState.selectedFile,
      previewUrl: mockAvatarState.previewUrl,
      error: mockAvatarState.error,
      handleFileSelect: mockHandleFileSelect,
      uploadAvatar: mockUploadAvatar,
      clearSelection: mockClearSelection,
    };
  }),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('useCreateProfile', () => {
  let queryClient: QueryClient;

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

    // Reset avatar state
    mockAvatarState.selectedFile = null;
    mockAvatarState.previewUrl = null;
    mockAvatarState.error = null;

    // Reset capturedOnError
    capturedOnError = undefined;

    // Reset useAvatarUpload mock to default implementation
    const { useAvatarUpload } = jest.requireMock(
      '@pokehub/frontend/pokehub-ui-components'
    );
    useAvatarUpload.mockImplementation(
      (options?: { onError?: (error: Error) => void }) => {
        capturedOnError = options?.onError;
        return {
          selectedFile: mockAvatarState.selectedFile,
          previewUrl: mockAvatarState.previewUrl,
          error: mockAvatarState.error,
          handleFileSelect: mockHandleFileSelect,
          uploadAvatar: mockUploadAvatar,
          clearSelection: mockClearSelection,
        };
      }
    );

    // Default mock: profile update succeeds
    mockMutateAsync.mockResolvedValue({
      username: 'testuser',
      avatar: null,
    });

    // Default mock: avatar upload succeeds (returns null when no file selected)
    mockUploadAvatar.mockResolvedValue(null);
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('hook return values', () => {
    it('should return all expected properties', () => {
      const { result } = renderHook(() => useCreateProfile(), { wrapper });

      expect(result.current).toHaveProperty('avatarFile');
      expect(result.current).toHaveProperty('avatarPreviewUrl');
      expect(result.current).toHaveProperty('avatarError');
      expect(result.current).toHaveProperty('handleFileSelect');
      expect(result.current).toHaveProperty('createProfile');
      expect(result.current).toHaveProperty('isPending');
      expect(result.current).toHaveProperty('isSuccess');
    });

    it('should return values from useAvatarUpload', () => {
      const mockFile = createMockFile('avatar.png');
      mockAvatarState.selectedFile = mockFile;
      mockAvatarState.previewUrl = 'blob:http://localhost/preview';
      mockAvatarState.error = null;

      // Re-mock useAvatarUpload with updated state
      const { useAvatarUpload } = jest.requireMock(
        '@pokehub/frontend/pokehub-ui-components'
      );
      useAvatarUpload.mockReturnValue({
        selectedFile: mockFile,
        previewUrl: 'blob:http://localhost/preview',
        error: null,
        handleFileSelect: mockHandleFileSelect,
        uploadAvatar: mockUploadAvatar,
        clearSelection: mockClearSelection,
      });

      const { result } = renderHook(() => useCreateProfile(), { wrapper });

      expect(result.current.avatarFile).toBe(mockFile);
      expect(result.current.avatarPreviewUrl).toBe(
        'blob:http://localhost/preview'
      );
      expect(result.current.avatarError).toBeNull();
      expect(result.current.handleFileSelect).toBe(mockHandleFileSelect);
    });
  });

  describe('profile creation without avatar', () => {
    it('should create profile with username only', async () => {
      const { result } = renderHook(() => useCreateProfile(), { wrapper });

      await act(async () => {
        await result.current.createProfile({ username: 'newuser' });
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        username: 'newuser',
        avatarFileName: undefined,
      });
    });

    it('should not call uploadAvatar when no file is selected', async () => {
      mockUploadAvatar.mockResolvedValue(null);

      const { result } = renderHook(() => useCreateProfile(), { wrapper });

      await act(async () => {
        await result.current.createProfile({ username: 'newuser' });
      });

      // uploadAvatar should not be called when no file is selected
      expect(mockUploadAvatar).not.toHaveBeenCalled();
    });

    it('should call clearSelection after successful profile creation', async () => {
      const { result } = renderHook(() => useCreateProfile(), { wrapper });

      await act(async () => {
        await result.current.createProfile({ username: 'newuser' });
      });

      expect(mockClearSelection).toHaveBeenCalled();
    });
  });

  describe('profile creation with avatar', () => {
    it('should upload avatar before creating profile', async () => {
      const mockFile = createMockFile('avatar.png');

      // Set up avatar upload to return success
      mockUploadAvatar.mockResolvedValue({
        avatarUrl: 'https://azure.blob.storage/avatars/user-123/avatar.png',
        fileName: 'avatar.png',
      });

      // Re-mock useAvatarUpload with file selected
      const { useAvatarUpload } = jest.requireMock(
        '@pokehub/frontend/pokehub-ui-components'
      );
      useAvatarUpload.mockReturnValue({
        selectedFile: mockFile,
        previewUrl: 'blob:http://localhost/preview',
        error: null,
        handleFileSelect: mockHandleFileSelect,
        uploadAvatar: mockUploadAvatar,
        clearSelection: mockClearSelection,
      });

      const { result } = renderHook(() => useCreateProfile(), { wrapper });

      await act(async () => {
        await result.current.createProfile({ username: 'testuser' });
      });

      // Verify avatar upload was called first
      expect(mockUploadAvatar).toHaveBeenCalled();

      // Verify profile was created with avatar filename
      expect(mockMutateAsync).toHaveBeenCalledWith({
        username: 'testuser',
        avatarFileName: 'avatar.png',
      });
    });

    it('should include avatar filename in profile data', async () => {
      const mockFile = createMockFile('myavatar.png');

      mockUploadAvatar.mockResolvedValue({
        avatarUrl: 'https://azure.blob.storage/avatars/user-123/myavatar.png',
        fileName: 'myavatar.png',
      });

      const { useAvatarUpload } = jest.requireMock(
        '@pokehub/frontend/pokehub-ui-components'
      );
      useAvatarUpload.mockReturnValue({
        selectedFile: mockFile,
        previewUrl: 'blob:http://localhost/preview',
        error: null,
        handleFileSelect: mockHandleFileSelect,
        uploadAvatar: mockUploadAvatar,
        clearSelection: mockClearSelection,
      });

      const { result } = renderHook(() => useCreateProfile(), { wrapper });

      await act(async () => {
        await result.current.createProfile({ username: 'testuser' });
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        username: 'testuser',
        avatarFileName: 'myavatar.png',
      });
    });

    it('should call clearSelection after successful profile creation with avatar', async () => {
      const mockFile = createMockFile('avatar.png');

      mockUploadAvatar.mockResolvedValue({
        avatarUrl: 'https://azure.blob.storage/avatars/user-123/avatar.png',
        fileName: 'avatar.png',
      });

      const { useAvatarUpload } = jest.requireMock(
        '@pokehub/frontend/pokehub-ui-components'
      );
      useAvatarUpload.mockReturnValue({
        selectedFile: mockFile,
        previewUrl: 'blob:http://localhost/preview',
        error: null,
        handleFileSelect: mockHandleFileSelect,
        uploadAvatar: mockUploadAvatar,
        clearSelection: mockClearSelection,
      });

      const { result } = renderHook(() => useCreateProfile(), { wrapper });

      await act(async () => {
        await result.current.createProfile({ username: 'testuser' });
      });

      expect(mockClearSelection).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should return early when avatar upload fails', async () => {
      const mockFile = createMockFile('avatar.png');

      // Avatar upload returns null (failure)
      mockUploadAvatar.mockResolvedValue(null);

      const { useAvatarUpload } = jest.requireMock(
        '@pokehub/frontend/pokehub-ui-components'
      );
      useAvatarUpload.mockImplementation(
        (options?: { onError?: (error: Error) => void }) => {
          capturedOnError = options?.onError;
          return {
            selectedFile: mockFile,
            previewUrl: 'blob:http://localhost/preview',
            error: null,
            handleFileSelect: mockHandleFileSelect,
            uploadAvatar: mockUploadAvatar,
            clearSelection: mockClearSelection,
          };
        }
      );

      const { result } = renderHook(() => useCreateProfile(), { wrapper });

      await act(async () => {
        await result.current.createProfile({ username: 'testuser' });
      });

      // Profile update should not be called since we returned early
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('should show error toast when avatar upload fails', async () => {
      const mockFile = createMockFile('avatar.png');

      // Mock uploadAvatar to call onError callback and return null
      mockUploadAvatar.mockImplementation(async () => {
        // Simulate the real useAvatarUpload behavior - call onError when upload fails
        capturedOnError?.(new Error('Failed to upload avatar'));
        return null;
      });

      const { useAvatarUpload } = jest.requireMock(
        '@pokehub/frontend/pokehub-ui-components'
      );
      useAvatarUpload.mockImplementation(
        (options?: { onError?: (error: Error) => void }) => {
          capturedOnError = options?.onError;
          return {
            selectedFile: mockFile,
            previewUrl: 'blob:http://localhost/preview',
            error: null,
            handleFileSelect: mockHandleFileSelect,
            uploadAvatar: mockUploadAvatar,
            clearSelection: mockClearSelection,
          };
        }
      );

      const { result } = renderHook(() => useCreateProfile(), { wrapper });

      await act(async () => {
        await result.current.createProfile({ username: 'testuser' });
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to upload avatar');
      });
    });

    it('should not call clearSelection when avatar upload fails', async () => {
      const mockFile = createMockFile('avatar.png');

      mockUploadAvatar.mockResolvedValue(null);

      const { useAvatarUpload } = jest.requireMock(
        '@pokehub/frontend/pokehub-ui-components'
      );
      useAvatarUpload.mockImplementation(
        (options?: { onError?: (error: Error) => void }) => {
          capturedOnError = options?.onError;
          return {
            selectedFile: mockFile,
            previewUrl: 'blob:http://localhost/preview',
            error: null,
            handleFileSelect: mockHandleFileSelect,
            uploadAvatar: mockUploadAvatar,
            clearSelection: mockClearSelection,
          };
        }
      );

      const { result } = renderHook(() => useCreateProfile(), { wrapper });

      await act(async () => {
        await result.current.createProfile({ username: 'testuser' });
      });

      expect(mockClearSelection).not.toHaveBeenCalled();
    });
  });

  describe('mutation state', () => {
    it('should return isPending from useUpdateUserProfile', () => {
      const { useUpdateUserProfile } = jest.requireMock(
        '@pokehub/frontend/pokehub-data-provider'
      );
      useUpdateUserProfile.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
        isSuccess: false,
      });

      const { result } = renderHook(() => useCreateProfile(), { wrapper });

      expect(result.current.isPending).toBe(true);
    });

    it('should return isSuccess from useUpdateUserProfile', () => {
      const { useUpdateUserProfile } = jest.requireMock(
        '@pokehub/frontend/pokehub-data-provider'
      );
      useUpdateUserProfile.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        isSuccess: true,
      });

      const { result } = renderHook(() => useCreateProfile(), { wrapper });

      expect(result.current.isSuccess).toBe(true);
    });
  });
});
