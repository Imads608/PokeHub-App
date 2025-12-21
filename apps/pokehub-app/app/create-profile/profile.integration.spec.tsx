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

// Mock API calls
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

// Mock withAuthRetry to pass through
jest.mock('@pokehub/frontend/pokehub-data-provider', () => ({
  withAuthRetry: jest.fn(async (_token, callback) => callback(_token)),
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

    // Default: username is available (404 means not found = available)
    mockFetchThrowsError.mockRejectedValue({ status: 404 });

    // Mock global fetch for Azure upload
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
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

      // Setup: username check returns 404 (available), profile update succeeds
      mockFetchThrowsError
        .mockRejectedValueOnce({ status: 404 }) // Username check - available
        .mockResolvedValueOnce({
          // Profile update
          json: jest.fn().mockResolvedValue({
            username: 'newtrainer',
            avatar: null,
          }),
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

      // Verify success toast
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Profile was updated successfully'
        );
      });

      // Verify session update was called
      expect(mockUpdate).toHaveBeenCalled();
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

      // Mock URL.createObjectURL for avatar preview
      const mockObjectUrl = 'blob:http://localhost/avatar-preview';
      global.URL.createObjectURL = jest.fn().mockReturnValue(mockObjectUrl);

      // Setup API responses
      mockFetchThrowsError
        .mockRejectedValueOnce({ status: 404 }) // Username check - available
        .mockResolvedValueOnce({
          // Generate upload URL
          json: jest.fn().mockResolvedValue({
            uploadUrl: 'https://azure.blob.storage/upload?sas=token',
          }),
        })
        .mockResolvedValueOnce({
          // Profile update
          json: jest.fn().mockResolvedValue({
            username: 'newtrainer',
            avatar: 'https://azure.blob.storage/avatars/user-123/avatar.png',
          }),
        });

      renderComponent();

      // Upload avatar file
      const file = new File(['avatar-content'], 'avatar.png', {
        type: 'image/png',
      });
      const fileInput = document.getElementById(
        'avatar-upload'
      ) as HTMLInputElement;
      await user.upload(fileInput, file);

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

      // Verify success toast
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'Profile was updated successfully'
        );
      });

      // Verify Azure upload was called
      expect(global.fetch).toHaveBeenCalledWith(
        'https://azure.blob.storage/upload?sas=token',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'x-ms-blob-type': 'BlockBlob',
            'Content-Type': 'image/png',
          },
        })
      );

      // Verify session update with avatar URL
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            avatarUrl: 'https://azure.blob.storage/avatars/user-123/avatar.png',
          }),
        })
      );
    });
  });
});
