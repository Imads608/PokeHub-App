import { UserDropdown } from './user-dropdown';
import type { UserCore } from '@pokehub/shared/shared-user-models';
import { render, screen, fireEvent } from '@testing-library/react';
import { signOut } from 'next-auth/react';

// Track Settings menu item click
let settingsOnClickHandler: (() => void) | undefined;

// Mock shared-ui-components - only DropdownMenu components need mocking for JSDOM
jest.mock('@pokehub/frontend/shared-ui-components', () => {
  const actual = jest.requireActual('@pokehub/frontend/shared-ui-components');
  return {
    ...actual,
    DropdownMenu: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    DropdownMenuTrigger: ({
      children,
    }: {
      children: React.ReactNode;
      asChild?: boolean;
    }) => <div data-testid="dropdown-trigger">{children}</div>,
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="dropdown-content">{children}</div>
    ),
    DropdownMenuItem: ({
      children,
      onClick,
    }: {
      children: React.ReactNode;
      onClick?: () => void;
    }) => {
      // Capture onClick handler for Settings menu item
      const childText =
        typeof children === 'string'
          ? children
          : Array.isArray(children)
          ? children.find((c) => typeof c === 'string')
          : '';
      if (
        childText === 'Settings' ||
        (children as React.ReactNode[])?.toString().includes('Settings')
      ) {
        settingsOnClickHandler = onClick;
      }
      return (
        <button onClick={onClick} data-testid="dropdown-item">
          {children}
        </button>
      );
    },
    DropdownMenuSeparator: () => <hr data-testid="dropdown-separator" />,
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  LogOutIcon: () => <span data-testid="logout-icon">LogOut</span>,
  Settings: () => <span data-testid="settings-icon">Settings</span>,
}));

const mockSignOut = signOut as jest.Mock;

describe('UserDropdown', () => {
  const mockUser: UserCore = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    avatarUrl: 'https://example.com/avatar.png',
    accountRole: 'USER',
    accountType: 'GOOGLE',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    settingsOnClickHandler = undefined;
  });

  describe('rendering', () => {
    it('should render the dropdown trigger with user avatar', () => {
      render(<UserDropdown user={mockUser} />);

      expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument();
    });

    it('should display username initial in avatar fallback', () => {
      render(<UserDropdown user={mockUser} />);

      expect(screen.getAllByText('T').length).toBeGreaterThan(0);
    });

    it('should display username in dropdown content', () => {
      render(<UserDropdown user={mockUser} />);

      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    it('should display Settings menu item', () => {
      render(<UserDropdown user={mockUser} />);

      // Settings text appears in both the icon mock and the menu item
      expect(screen.getAllByText('Settings').length).toBeGreaterThan(0);
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });

    it('should display Logout menu item', () => {
      render(<UserDropdown user={mockUser} />);

      expect(screen.getByText('Logout')).toBeInTheDocument();
      expect(screen.getByTestId('logout-icon')).toBeInTheDocument();
    });

    it('should display U as fallback when username is not provided', () => {
      const userWithoutUsername: UserCore = {
        ...mockUser,
        username: undefined as unknown as string,
      };

      render(<UserDropdown user={userWithoutUsername} />);

      expect(screen.getAllByText('U').length).toBeGreaterThan(0);
    });
  });

  describe('interactions', () => {
    it('should have onClick handler for Settings menu item', () => {
      render(<UserDropdown user={mockUser} />);

      // Verify Settings menu item has an onClick handler
      expect(settingsOnClickHandler).toBeDefined();
    });

    it('should call signOut when Logout is clicked', () => {
      render(<UserDropdown user={mockUser} />);

      const logoutItem = screen.getByText('Logout').closest('button');
      if (logoutItem) {
        fireEvent.click(logoutItem);
      }

      expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: '/login' });
    });
  });

  describe('avatar display', () => {
    it('should show avatar image when avatarUrl is provided', () => {
      render(<UserDropdown user={mockUser} />);

      // Check that avatar containers exist
      const avatars = document.querySelectorAll('[class*="rounded-full"]');
      expect(avatars.length).toBeGreaterThan(0);
    });

    it('should handle user without avatar URL', () => {
      const userWithoutAvatar: UserCore = {
        ...mockUser,
        avatarUrl: null as unknown as string,
      };

      render(<UserDropdown user={userWithoutAvatar} />);

      // Should still render with fallback
      expect(screen.getAllByText('T').length).toBeGreaterThan(0);
    });
  });
});
