import { AvatarUpload } from './avatar-upload';
import { useAvatarUpload } from './use-avatar-upload';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock the useAvatarUpload hook
jest.mock('./use-avatar-upload', () => ({
  useAvatarUpload: jest.fn(),
}));

// Mock shared-ui-components Avatar to avoid Radix UI complexity
jest.mock('@pokehub/frontend/shared-ui-components', () => {
  const actual = jest.requireActual('@pokehub/frontend/shared-ui-components');
  return {
    ...actual,
    Avatar: ({
      children,
      className,
      'data-testid': testId,
    }: {
      children: React.ReactNode;
      className?: string;
      'data-testid'?: string;
    }) => (
      <span className={className} data-testid={testId}>
        {children}
      </span>
    ),
    AvatarImage: ({
      src,
      alt,
      'data-testid': testId,
    }: {
      src?: string;
      alt?: string;
      'data-testid'?: string;
    }) => (src ? <img src={src} alt={alt} data-testid={testId} /> : null),
    AvatarFallback: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => <span className={className}>{children}</span>,
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  User: () => <div data-testid="user-icon">User Icon</div>,
  Upload: () => <div data-testid="upload-icon">Upload Icon</div>,
  Loader2: () => <div data-testid="loader-icon">Loader Icon</div>,
}));

const mockUseAvatarUpload = useAvatarUpload as jest.Mock;

describe('AvatarUpload', () => {
  const defaultHookReturn = {
    previewUrl: null,
    isUploading: false,
    error: null,
    handleFileSelect: jest.fn(),
    selectedFile: null,
    uploadAvatar: jest.fn(),
    clearSelection: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAvatarUpload.mockReturnValue(defaultHookReturn);
  });

  describe('avatar rendering', () => {
    it('should render avatar with currentAvatarUrl', () => {
      render(
        <AvatarUpload currentAvatarUrl="https://example.com/avatar.png" />
      );

      const avatarImage = screen.getByTestId('avatar-upload-image');
      expect(avatarImage).toHaveAttribute(
        'src',
        'https://example.com/avatar.png'
      );
    });

    it('should render fallback when no avatar URL', () => {
      render(<AvatarUpload fallbackText="J" />);

      const fallback = screen.getByText('J');
      expect(fallback).toBeInTheDocument();
    });

    it('should render user icon when no fallbackText provided', () => {
      render(<AvatarUpload fallbackText="" />);

      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('should capitalize fallback text', () => {
      render(<AvatarUpload fallbackText="john" />);

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should display previewUrl over currentAvatarUrl when available', () => {
      mockUseAvatarUpload.mockReturnValue({
        ...defaultHookReturn,
        previewUrl: 'blob:preview-url',
      });

      render(
        <AvatarUpload currentAvatarUrl="https://example.com/avatar.png" />
      );

      const avatarImage = screen.getByTestId('avatar-upload-image');
      expect(avatarImage).toHaveAttribute('src', 'blob:preview-url');
    });
  });

  describe('size variants', () => {
    it('should render small size correctly', () => {
      render(<AvatarUpload size="sm" />);

      const avatar = screen.getByTestId('avatar-upload-avatar');
      expect(avatar).toHaveClass('h-12', 'w-12');
    });

    it('should render medium size correctly', () => {
      render(<AvatarUpload size="md" />);

      const avatar = screen.getByTestId('avatar-upload-avatar');
      expect(avatar).toHaveClass('h-16', 'w-16');
    });

    it('should render large size correctly (default)', () => {
      render(<AvatarUpload size="lg" />);

      const avatar = screen.getByTestId('avatar-upload-avatar');
      expect(avatar).toHaveClass('h-24', 'w-24');
    });

    it('should use large size by default', () => {
      render(<AvatarUpload />);

      const avatar = screen.getByTestId('avatar-upload-avatar');
      expect(avatar).toHaveClass('h-24', 'w-24');
    });
  });

  describe('upload button', () => {
    it('should show upload button when enabled (default)', () => {
      render(<AvatarUpload />);

      expect(screen.getByTestId('avatar-upload-button')).toBeInTheDocument();
    });

    it('should hide upload button when showUploadButton is false', () => {
      render(<AvatarUpload showUploadButton={false} />);

      expect(
        screen.queryByTestId('avatar-upload-button')
      ).not.toBeInTheDocument();
    });

    it('should display custom button text', () => {
      render(<AvatarUpload buttonText="Upload Photo" />);

      expect(screen.getByText('Upload Photo')).toBeInTheDocument();
    });

    it('should display default button text', () => {
      render(<AvatarUpload />);

      expect(screen.getByText('Change Avatar')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<AvatarUpload disabled />);

      expect(screen.getByTestId('avatar-upload-button')).toBeDisabled();
    });

    it('should be disabled when uploading', () => {
      mockUseAvatarUpload.mockReturnValue({
        ...defaultHookReturn,
        isUploading: true,
      });

      render(<AvatarUpload />);

      expect(screen.getByTestId('avatar-upload-button')).toBeDisabled();
    });

    it('should show loading state when uploading', () => {
      mockUseAvatarUpload.mockReturnValue({
        ...defaultHookReturn,
        isUploading: true,
      });

      render(<AvatarUpload />);

      expect(screen.getByText('Uploading...')).toBeInTheDocument();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('should show upload icon when not uploading', () => {
      render(<AvatarUpload />);

      expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
    });
  });

  describe('file input', () => {
    it('should accept correct file types', () => {
      render(<AvatarUpload />);

      const input = screen.getByTestId('avatar-upload-input');
      expect(input).toHaveAttribute('accept', '.png,.jpg,.jpeg,.gif');
    });

    it('should be hidden', () => {
      render(<AvatarUpload />);

      const input = screen.getByTestId('avatar-upload-input');
      expect(input).toHaveClass('hidden');
    });

    it('should be disabled when disabled prop is true', () => {
      render(<AvatarUpload disabled />);

      const input = screen.getByTestId('avatar-upload-input');
      expect(input).toBeDisabled();
    });

    it('should be disabled when uploading', () => {
      mockUseAvatarUpload.mockReturnValue({
        ...defaultHookReturn,
        isUploading: true,
      });

      render(<AvatarUpload />);

      const input = screen.getByTestId('avatar-upload-input');
      expect(input).toBeDisabled();
    });

    it('should call handleFileSelect when file is selected', () => {
      const handleFileSelect = jest.fn();
      mockUseAvatarUpload.mockReturnValue({
        ...defaultHookReturn,
        handleFileSelect,
      });

      render(<AvatarUpload />);

      const input = screen.getByTestId('avatar-upload-input');
      const file = new File(['test'], 'avatar.png', { type: 'image/png' });

      fireEvent.change(input, { target: { files: [file] } });

      expect(handleFileSelect).toHaveBeenCalled();
    });
  });

  describe('error display', () => {
    it('should display error message when error exists', () => {
      mockUseAvatarUpload.mockReturnValue({
        ...defaultHookReturn,
        error: 'Invalid file type',
      });

      render(<AvatarUpload />);

      expect(screen.getByText('Invalid file type')).toBeInTheDocument();
      expect(screen.getByTestId('avatar-upload-error')).toBeInTheDocument();
    });

    it('should not display error when no error', () => {
      render(<AvatarUpload />);

      expect(
        screen.queryByTestId('avatar-upload-error')
      ).not.toBeInTheDocument();
    });

    it('should apply destructive text style to error', () => {
      mockUseAvatarUpload.mockReturnValue({
        ...defaultHookReturn,
        error: 'Upload failed',
      });

      render(<AvatarUpload />);

      const errorElement = screen.getByTestId('avatar-upload-error');
      expect(errorElement).toHaveClass('text-destructive');
    });
  });

  describe('hook callbacks', () => {
    it('should pass onUploadComplete to hook', () => {
      const onUploadComplete = jest.fn();
      render(<AvatarUpload onUploadComplete={onUploadComplete} />);

      expect(mockUseAvatarUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          onUploadComplete,
        })
      );
    });

    it('should pass onError to hook', () => {
      const onError = jest.fn();
      render(<AvatarUpload onError={onError} />);

      expect(mockUseAvatarUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          onError,
        })
      );
    });
  });

  describe('testId customization', () => {
    it('should use custom testId', () => {
      render(<AvatarUpload testId="custom-avatar" />);

      expect(screen.getByTestId('custom-avatar')).toBeInTheDocument();
      expect(screen.getByTestId('custom-avatar-avatar')).toBeInTheDocument();
      expect(screen.getByTestId('custom-avatar-button')).toBeInTheDocument();
      expect(screen.getByTestId('custom-avatar-input')).toBeInTheDocument();
    });

    it('should use default testId', () => {
      render(<AvatarUpload />);

      expect(screen.getByTestId('avatar-upload')).toBeInTheDocument();
    });
  });
});
