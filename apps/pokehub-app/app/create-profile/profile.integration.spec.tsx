import { CreateProfileContainer } from './profile';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { toast } from 'sonner';

// Mock next-auth/react
const mockUpdate = jest.fn();
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: { id: 'user-123', email: 'test@example.com' },
      accessToken: 'mock-access-token',
    },
    status: 'authenticated',
    update: mockUpdate,
  })),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock shared-auth to return session data
jest.mock('@pokehub/frontend/shared-auth', () => ({
  useAuthSession: () => ({
    data: {
      user: { id: 'user-123', email: 'test@example.com' },
      accessToken: 'mock-access-token',
    },
    status: 'authenticated',
    update: mockUpdate,
  }),
}));

// Mock API calls for username check
const mockFetchThrowsError = jest.fn();
jest.mock('@pokehub/frontend/shared-data-provider', () => ({
  getFetchClient: () => ({
    fetchThrowsError: mockFetchThrowsError,
  }),
  FetchApiError: class FetchApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

// Mock pokehub-data-provider hooks
const mockMutateAsync = jest.fn();
jest.mock('@pokehub/frontend/pokehub-data-provider', () => ({
  withAuthRetry: jest.fn(async (_token, callback) => callback(_token)),
  useUpdateUserProfile: jest.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    isSuccess: false,
  })),
}));

// Mock useAvatarUpload hook
const mockUploadAvatar = jest.fn();
const mockHandleFileSelect = jest.fn();
const mockClearSelection = jest.fn();
let capturedOnError: ((error: Error) => void) | undefined;

const mockAvatarState = {
  selectedFile: null as File | null,
  previewUrl: null as string | null,
};

jest.mock('@pokehub/frontend/pokehub-ui-components', () => ({
  useAvatarUpload: jest.fn((options?: { onError?: (error: Error) => void }) => {
    capturedOnError = options?.onError;
    return {
      selectedFile: mockAvatarState.selectedFile,
      previewUrl: mockAvatarState.previewUrl,
      error: null,
      handleFileSelect: mockHandleFileSelect,
      uploadAvatar: mockUploadAvatar,
      clearSelection: mockClearSelection,
    };
  }),
}));

// Mock shared-utils
jest.mock('@pokehub/frontend/shared-utils', () => ({
  isValidAvatarFileName: jest.fn(() => true),
}));

describe('CreateProfileContainer Integration', () => {
  let queryClient: QueryClient;

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
    jest.useFakeTimers();

    // Reset avatar state
    mockAvatarState.selectedFile = null;
    mockAvatarState.previewUrl = null;

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
          error: null,
          handleFileSelect: mockHandleFileSelect,
          uploadAvatar: mockUploadAvatar,
          clearSelection: mockClearSelection,
        };
      }
    );

    // Default: username is available (404 means not found = available)
    mockFetchThrowsError.mockRejectedValue({ status: 404 });

    // Default: profile update succeeds
    mockMutateAsync.mockResolvedValue({
      username: 'newtrainer',
      avatar: null,
    });

    // Default: avatar upload succeeds (returns null when no file selected)
    mockUploadAvatar.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
    queryClient.clear();
  });

  const renderComponent = () => {
    return render(<CreateProfileContainer />, { wrapper });
  };

  describe('full form submission flow without avatar', () => {
    it('should complete profile creation successfully', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      renderComponent();

      // Type username
      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'newtrainer');

      // Wait for debounce - wrap in act() since it triggers state updates
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Wait for submit button to be enabled
      await waitFor(() => {
        const submitButton = screen.getByRole('button', {
          name: /create profile/i,
        });
        expect(submitButton).not.toBeDisabled();
      });

      // Submit form
      const submitButton = screen.getByRole('button', {
        name: /create profile/i,
      });
      await user.click(submitButton);

      // Verify mutation was called with correct data
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          username: 'newtrainer',
          avatarFileName: undefined,
        });
      });

      // Verify clearSelection was called after successful submission
      expect(mockClearSelection).toHaveBeenCalled();
    });
  });

  describe('username taken flow', () => {
    it('should show taken indicator and keep submit disabled', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      // Username check returns 200 (found = taken)
      mockFetchThrowsError.mockResolvedValue({
        json: jest.fn().mockResolvedValue(null),
      });

      renderComponent();

      // Type username
      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'takenuser');

      // Wait for debounce - wrap in act() since it triggers state updates
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Submit button should remain disabled
      await waitFor(() => {
        const submitButton = screen.getByRole('button', {
          name: /create profile/i,
        });
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('avatar upload flow', () => {
    it('should complete profile creation with avatar', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      // Setup: avatar upload returns success
      const mockFile = new File(['avatar-content'], 'avatar.png', {
        type: 'image/png',
      });
      mockAvatarState.selectedFile = mockFile;
      mockAvatarState.previewUrl = 'blob:http://localhost/avatar-preview';

      mockUploadAvatar.mockResolvedValue({
        avatarUrl: 'https://azure.blob.storage/avatars/user-123/avatar.png',
        fileName: 'avatar.png',
      });

      mockMutateAsync.mockResolvedValue({
        username: 'newtrainer',
        avatar: 'https://azure.blob.storage/avatars/user-123/avatar.png',
      });

      // Re-mock useAvatarUpload with the file selected
      const { useAvatarUpload } = jest.requireMock(
        '@pokehub/frontend/pokehub-ui-components'
      );
      useAvatarUpload.mockReturnValue({
        selectedFile: mockFile,
        previewUrl: 'blob:http://localhost/avatar-preview',
        error: null,
        handleFileSelect: mockHandleFileSelect,
        uploadAvatar: mockUploadAvatar,
        clearSelection: mockClearSelection,
      });

      renderComponent();

      // Type username
      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'newtrainer');

      // Wait for debounce - wrap in act() since it triggers state updates
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Wait for submit button to be enabled
      await waitFor(() => {
        const submitButton = screen.getByRole('button', {
          name: /create profile/i,
        });
        expect(submitButton).not.toBeDisabled();
      });

      // Submit form
      const submitButton = screen.getByRole('button', {
        name: /create profile/i,
      });
      await user.click(submitButton);

      // Verify avatar upload was called
      await waitFor(() => {
        expect(mockUploadAvatar).toHaveBeenCalled();
      });

      // Verify mutation was called with avatar filename
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          username: 'newtrainer',
          avatarFileName: 'avatar.png',
        });
      });

      // Verify clearSelection was called after successful submission
      expect(mockClearSelection).toHaveBeenCalled();
    });

    it('should handle avatar upload failure', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      // Setup: avatar upload fails
      const mockFile = new File(['avatar-content'], 'avatar.png', {
        type: 'image/png',
      });

      // Mock uploadAvatar to call onError callback and return null
      mockUploadAvatar.mockImplementation(async () => {
        // Simulate the real useAvatarUpload behavior - call onError when upload fails
        capturedOnError?.(new Error('Failed to upload avatar'));
        return null;
      });

      // Re-mock useAvatarUpload with the file selected
      const { useAvatarUpload } = jest.requireMock(
        '@pokehub/frontend/pokehub-ui-components'
      );
      useAvatarUpload.mockImplementation(
        (options?: { onError?: (error: Error) => void }) => {
          capturedOnError = options?.onError;
          return {
            selectedFile: mockFile,
            previewUrl: 'blob:http://localhost/avatar-preview',
            error: null,
            handleFileSelect: mockHandleFileSelect,
            uploadAvatar: mockUploadAvatar,
            clearSelection: mockClearSelection,
          };
        }
      );

      renderComponent();

      // Type username
      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'newtrainer');

      // Wait for debounce
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Wait for submit button to be enabled
      await waitFor(() => {
        const submitButton = screen.getByRole('button', {
          name: /create profile/i,
        });
        expect(submitButton).not.toBeDisabled();
      });

      // Submit form
      const submitButton = screen.getByRole('button', {
        name: /create profile/i,
      });
      await user.click(submitButton);

      // Verify avatar upload was called
      await waitFor(() => {
        expect(mockUploadAvatar).toHaveBeenCalled();
      });

      // Mutation should not be called since avatar upload failed
      expect(mockMutateAsync).not.toHaveBeenCalled();

      // Verify error toast
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to upload avatar');
      });
    });
  });
});
