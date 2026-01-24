import { SettingsContainer } from './settings';
import {
  useUpdateUserProfile,
  useDeleteAccount,
} from '@pokehub/frontend/pokehub-data-provider';
import { useAvatarUpload } from '@pokehub/frontend/pokehub-ui-components';
// Import mocked modules for manipulation
import { useAuthSession } from '@pokehub/frontend/shared-auth';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock hooks
const mockUpdateProfile = jest.fn();
const mockDeleteAccount = jest.fn();
const mockUploadAvatar = jest.fn();
const mockClearSelection = jest.fn();
const mockHandleFileSelect = jest.fn();

jest.mock('@pokehub/frontend/pokehub-data-provider', () => ({
  useUpdateUserProfile: jest.fn(() => ({
    mutateAsync: mockUpdateProfile,
    isPending: false,
  })),
  useDeleteAccount: jest.fn(() => ({
    mutate: mockDeleteAccount,
    isPending: false,
  })),
}));

jest.mock('@pokehub/frontend/pokehub-ui-components', () => ({
  useAvatarUpload: jest.fn(() => ({
    previewUrl: null,
    isUploading: false,
    error: null,
    handleFileSelect: mockHandleFileSelect,
    uploadAvatar: mockUploadAvatar,
    clearSelection: mockClearSelection,
  })),
}));

jest.mock('@pokehub/frontend/shared-auth', () => ({
  useAuthSession: jest.fn(),
}));

// Mock only Dialog components from shared-ui-components (Radix portals don't work well in JSDOM)
jest.mock('@pokehub/frontend/shared-ui-components', () => {
  const actual = jest.requireActual('@pokehub/frontend/shared-ui-components');
  return {
    ...actual,
    Dialog: ({
      children,
      open,
    }: {
      children: React.ReactNode;
      open?: boolean;
    }) => (open ? <div role="dialog">{children}</div> : null),
    DialogContent: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    DialogDescription: ({ children }: { children: React.ReactNode }) => (
      <p>{children}</p>
    ),
    DialogFooter: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    DialogHeader: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    DialogTitle: ({ children }: { children: React.ReactNode }) => (
      <h2>{children}</h2>
    ),
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertTriangle: () => <span data-testid="alert-icon">Alert</span>,
  Loader2: () => <span data-testid="loader-icon">Loading</span>,
  Upload: () => <span data-testid="upload-icon">Upload</span>,
  User: () => <span data-testid="user-icon">User</span>,
}));

const mockUseAuthSession = useAuthSession as jest.Mock;
const mockUseUpdateUserProfile = useUpdateUserProfile as jest.Mock;
const mockUseDeleteAccount = useDeleteAccount as jest.Mock;
const mockUseAvatarUpload = useAvatarUpload as jest.Mock;

describe('SettingsContainer', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    avatarUrl: 'https://example.com/avatar.png',
    accountRole: 'USER',
    accountType: 'GOOGLE',
  };

  const mockSession = {
    accessToken: 'mock-token',
    user: mockUser,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuthSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    });

    mockUseUpdateUserProfile.mockReturnValue({
      mutateAsync: mockUpdateProfile,
      isPending: false,
    });

    mockUseDeleteAccount.mockReturnValue({
      mutate: mockDeleteAccount,
      isPending: false,
    });

    mockUseAvatarUpload.mockReturnValue({
      previewUrl: null,
      isUploading: false,
      error: null,
      handleFileSelect: mockHandleFileSelect,
      uploadAvatar: mockUploadAvatar,
      clearSelection: mockClearSelection,
    });
  });

  describe('loading state', () => {
    it('should render loading spinner when user is undefined', () => {
      mockUseAuthSession.mockReturnValue({
        data: { user: undefined },
        status: 'loading',
      });

      render(<SettingsContainer />);

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('should render loading spinner when session is null', () => {
      mockUseAuthSession.mockReturnValue({
        data: null,
        status: 'loading',
      });

      render(<SettingsContainer />);

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });
  });

  describe('profile section', () => {
    it('should display page title', () => {
      render(<SettingsContainer />);

      expect(
        screen.getByRole('heading', { name: /Settings/i })
      ).toBeInTheDocument();
    });

    it('should display user avatar', () => {
      render(<SettingsContainer />);

      // Check for avatar container by its common class
      const avatars = document.querySelectorAll('[class*="rounded-full"]');
      expect(avatars.length).toBeGreaterThan(0);
    });

    it('should display username', () => {
      render(<SettingsContainer />);

      expect(screen.getAllByText('testuser').length).toBeGreaterThan(0);
    });

    it('should display first letter of username in fallback when avatar not loaded', () => {
      mockUseAuthSession.mockReturnValue({
        data: { user: { ...mockUser, avatarUrl: null } },
        status: 'authenticated',
      });

      render(<SettingsContainer />);

      // The fallback should show the first letter of the username
      expect(screen.getAllByText('T').length).toBeGreaterThan(0);
    });
  });

  describe('account section', () => {
    it('should display email with OAuth badge', () => {
      render(<SettingsContainer />);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText(/Google OAuth/i)).toBeInTheDocument();
    });

    it('should show username cannot be changed note', () => {
      render(<SettingsContainer />);

      expect(screen.getByText(/Cannot change/i)).toBeInTheDocument();
    });
  });

  describe('avatar section', () => {
    it('should show Choose File button', () => {
      render(<SettingsContainer />);

      expect(screen.getByText('Choose File')).toBeInTheDocument();
    });

    it('should show Choose Different button when preview exists', () => {
      mockUseAvatarUpload.mockReturnValue({
        previewUrl: 'blob:preview-url',
        isUploading: false,
        error: null,
        handleFileSelect: mockHandleFileSelect,
        uploadAvatar: mockUploadAvatar,
        clearSelection: mockClearSelection,
      });

      render(<SettingsContainer />);

      expect(screen.getByText('Choose Different')).toBeInTheDocument();
    });

    it('should show Save button when preview exists', () => {
      mockUseAvatarUpload.mockReturnValue({
        previewUrl: 'blob:preview-url',
        isUploading: false,
        error: null,
        handleFileSelect: mockHandleFileSelect,
        uploadAvatar: mockUploadAvatar,
        clearSelection: mockClearSelection,
      });

      render(<SettingsContainer />);

      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should show Cancel button when preview exists', () => {
      mockUseAvatarUpload.mockReturnValue({
        previewUrl: 'blob:preview-url',
        isUploading: false,
        error: null,
        handleFileSelect: mockHandleFileSelect,
        uploadAvatar: mockUploadAvatar,
        clearSelection: mockClearSelection,
      });

      render(<SettingsContainer />);

      expect(screen.getByTestId('avatar-cancel-button')).toBeInTheDocument();
    });

    it('should not show Save/Cancel in avatar section when no preview', () => {
      render(<SettingsContainer />);

      expect(
        screen.queryByTestId('avatar-save-button')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('avatar-cancel-button')
      ).not.toBeInTheDocument();
    });

    it('should call clearSelection when Cancel is clicked', () => {
      mockUseAvatarUpload.mockReturnValue({
        previewUrl: 'blob:preview-url',
        isUploading: false,
        error: null,
        handleFileSelect: mockHandleFileSelect,
        uploadAvatar: mockUploadAvatar,
        clearSelection: mockClearSelection,
      });

      render(<SettingsContainer />);

      fireEvent.click(screen.getByTestId('avatar-cancel-button'));

      expect(mockClearSelection).toHaveBeenCalled();
    });

    it('should call uploadAvatar and updateProfile when Save is clicked', async () => {
      mockUploadAvatar.mockResolvedValue({
        avatarUrl: 'new-url',
        fileName: 'avatar.png',
      });
      mockUpdateProfile.mockResolvedValue({});

      mockUseAvatarUpload.mockReturnValue({
        previewUrl: 'blob:preview-url',
        isUploading: false,
        error: null,
        handleFileSelect: mockHandleFileSelect,
        uploadAvatar: mockUploadAvatar,
        clearSelection: mockClearSelection,
      });

      render(<SettingsContainer />);

      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockUploadAvatar).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          avatarFileName: 'avatar.png',
        });
      });
    });

    it('should show loading state during save', () => {
      mockUseAvatarUpload.mockReturnValue({
        previewUrl: 'blob:preview-url',
        isUploading: true,
        error: null,
        handleFileSelect: mockHandleFileSelect,
        uploadAvatar: mockUploadAvatar,
        clearSelection: mockClearSelection,
      });

      render(<SettingsContainer />);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should show error message on avatar error', () => {
      mockUseAvatarUpload.mockReturnValue({
        previewUrl: null,
        isUploading: false,
        error: 'Invalid file type',
        handleFileSelect: mockHandleFileSelect,
        uploadAvatar: mockUploadAvatar,
        clearSelection: mockClearSelection,
      });

      render(<SettingsContainer />);

      expect(screen.getByText('Invalid file type')).toBeInTheDocument();
    });
  });

  describe('danger zone', () => {
    it('should display danger zone warning', () => {
      render(<SettingsContainer />);

      expect(screen.getByText('Danger Zone')).toBeInTheDocument();
      expect(screen.getByText(/there is no going back/i)).toBeInTheDocument();
    });

    it('should show Delete Account button', () => {
      render(<SettingsContainer />);

      expect(screen.getByTestId('delete-account-button')).toBeInTheDocument();
    });

    it('should open confirmation modal when Delete Account is clicked', async () => {
      render(<SettingsContainer />);

      fireEvent.click(screen.getByTestId('delete-account-button'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    });

    it('should close modal on Cancel', async () => {
      render(<SettingsContainer />);

      // Open modal
      fireEvent.click(screen.getByTestId('delete-account-button'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click cancel in dialog
      fireEvent.click(screen.getByTestId('dialog-cancel-button'));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should call deleteAccount when Confirm is clicked', async () => {
      render(<SettingsContainer />);

      // Open modal
      fireEvent.click(screen.getByTestId('delete-account-button'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Click confirm delete
      fireEvent.click(screen.getByTestId('dialog-confirm-delete-button'));

      expect(mockDeleteAccount).toHaveBeenCalled();
    });

    it('should show loading state during deletion', async () => {
      mockUseDeleteAccount.mockReturnValue({
        mutate: mockDeleteAccount,
        isPending: true,
      });

      render(<SettingsContainer />);

      // Open the dialog first
      fireEvent.click(screen.getByTestId('delete-account-button'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(screen.getByText('Deleting...')).toBeInTheDocument();
    });

    it('should display list of items to be deleted in modal', async () => {
      render(<SettingsContainer />);

      // Open the dialog first
      fireEvent.click(screen.getByTestId('delete-account-button'));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(screen.getByText(/Your profile and avatar/i)).toBeInTheDocument();
      expect(screen.getByText(/All your saved teams/i)).toBeInTheDocument();
    });
  });
});
