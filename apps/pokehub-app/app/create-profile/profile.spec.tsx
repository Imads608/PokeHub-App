import { CreateProfileContainer } from './profile';
import { useCheckUsername } from './useCheckUsername';
import { useCreateProfile } from './useCreateProfile';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

// Mock the hooks - these will be hoisted by Jest
jest.mock('./useCheckUsername');
jest.mock('./useCreateProfile');

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  User: () => <div data-testid="user-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
  ChevronRight: () => <div data-testid="chevron-icon" />,
  Check: () => <div data-testid="check-icon" />,
  X: () => <div data-testid="x-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
}));

// Mock next-auth/react to prevent ESM issues
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
}));

const mockUseCheckUsername = useCheckUsername as jest.Mock;
const mockUseCreateProfile = useCreateProfile as jest.Mock;

describe('CreateProfileContainer', () => {
  let queryClient: QueryClient;
  const mockMutateAsync = jest.fn();

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

    // Default mocks
    mockUseCheckUsername.mockReturnValue({
      error: null,
      status: 'idle',
      isLoading: false,
    });

    mockUseCreateProfile.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    queryClient.clear();
  });

  const renderComponent = () => {
    return render(<CreateProfileContainer />, { wrapper });
  };

  describe('rendering', () => {
    it('should render the profile creation form', () => {
      renderComponent();

      expect(
        screen.getByText('Create Your Trainer Profile')
      ).toBeInTheDocument();
      expect(screen.getByText('Trainer Details')).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByText('Upload Avatar')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /create profile/i })
      ).toBeInTheDocument();
    });

    it('should render the avatar upload section', () => {
      renderComponent();

      expect(screen.getByText('Upload Avatar')).toBeInTheDocument();
      expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
    });

    it('should disable submit button initially', () => {
      renderComponent();

      const submitButton = screen.getByRole('button', {
        name: /create profile/i,
      });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('username validation', () => {
    it('should show validation error for short username', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'ab');

      await waitFor(() => {
        expect(
          screen.getByText('Username must be at least 3 characters')
        ).toBeInTheDocument();
      });
    });

    it('should show validation error for long username', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'a'.repeat(21));

      await waitFor(() => {
        expect(
          screen.getByText('Username must be at most 20 characters')
        ).toBeInTheDocument();
      });
    });

    it('should show validation error for invalid characters', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'user@name');

      await waitFor(() => {
        expect(
          screen.getByText(
            'Username can only contain letters, numbers, and underscores'
          )
        ).toBeInTheDocument();
      });
    });

    it('should debounce username check', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'validuser');

      // Check not called immediately
      expect(mockUseCheckUsername).toHaveBeenLastCalledWith('');

      // Advance timers for debounce - wrap in act() since it triggers state updates
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(mockUseCheckUsername).toHaveBeenLastCalledWith('validuser');
      });
    });
  });

  describe('username availability status', () => {
    it('should show loading indicator while checking username', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockUseCheckUsername.mockReturnValue({
        error: null,
        status: 'pending',
        isLoading: true,
      });

      renderComponent();

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'testuser');
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      });
    });

    it('should show X icon when username is taken', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockUseCheckUsername.mockReturnValue({
        error: null,
        status: 'success',
        isLoading: false,
      });

      renderComponent();

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'takenuser');
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(screen.getByTestId('x-icon')).toBeInTheDocument();
      });
    });

    it('should show check icon when username is available', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockUseCheckUsername.mockReturnValue({
        error: { status: 404 },
        status: 'error',
        isLoading: false,
      });

      renderComponent();

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'availableuser');
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('should enable submit button when form is valid and username is available', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockUseCheckUsername.mockReturnValue({
        error: { status: 404 },
        status: 'error',
        isLoading: false,
      });

      renderComponent();

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'availableuser');
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        const submitButton = screen.getByRole('button', {
          name: /create profile/i,
        });
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should call mutateAsync when form is submitted', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockUseCheckUsername.mockReturnValue({
        error: { status: 404 },
        status: 'error',
        isLoading: false,
      });
      mockMutateAsync.mockResolvedValue({});

      renderComponent();

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'newusername');
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        const submitButton = screen.getByRole('button', {
          name: /create profile/i,
        });
        expect(submitButton).not.toBeDisabled();
      });

      const submitButton = screen.getByRole('button', {
        name: /create profile/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            username: 'newusername',
          })
        );
      });
    });

    it('should keep submit button disabled when username is taken', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockUseCheckUsername.mockReturnValue({
        error: null,
        status: 'success',
        isLoading: false,
      });

      renderComponent();

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'takenuser');
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        const submitButton = screen.getByRole('button', {
          name: /create profile/i,
        });
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('avatar upload', () => {
    it('should accept image file upload', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderComponent();

      const file = new File(['avatar-content'], 'avatar.png', {
        type: 'image/png',
      });
      const fileInput = document.getElementById(
        'avatar-upload'
      ) as HTMLInputElement;

      // Mock URL.createObjectURL
      const mockObjectUrl = 'blob:http://localhost/avatar-preview';
      global.URL.createObjectURL = jest.fn().mockReturnValue(mockObjectUrl);

      await user.upload(fileInput, file);

      // The file should be passed to useCreateProfile
      expect(mockUseCreateProfile).toHaveBeenCalled();
    });
  });
});
