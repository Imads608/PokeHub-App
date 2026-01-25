import { AppNav } from './app-nav';
import { useAuthSession } from '@pokehub/frontend/shared-auth';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { usePathname } from 'next/navigation';

// Type the mocked hooks
const mockUseAuthSession = useAuthSession as jest.MockedFunction<
  typeof useAuthSession
>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('AppNav', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should render loading skeleton when session is loading', () => {
      mockUseAuthSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      });

      render(<AppNav />);

      // Should render NavSkeleton - look for skeleton-specific elements
      expect(screen.getByTestId('nav-skeleton')).toBeInTheDocument();
    });
  });

  describe('Unauthenticated state', () => {
    beforeEach(() => {
      mockUseAuthSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });
    });

    it('should render the navbar', () => {
      render(<AppNav />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should render the logo with correct link', () => {
      render(<AppNav />);
      const logoLink = screen.getByRole('link', { name: /Logo.*Hub/i });
      expect(logoLink).toBeInTheDocument();
      expect(logoLink).toHaveAttribute('href', '/');
    });

    it('should render Pokedex link', () => {
      render(<AppNav />);
      expect(
        screen.getByRole('link', { name: /Pokedex/i })
      ).toBeInTheDocument();
    });

    it('should render Sign In link for unauthenticated users', () => {
      render(<AppNav />);
      expect(
        screen.getByRole('link', { name: /Sign In/i })
      ).toBeInTheDocument();
    });

    it('should not render authenticated-only navigation links', () => {
      render(<AppNav />);
      expect(screen.queryByText(/Dashboard/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Battle/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Team Builder/i)).not.toBeInTheDocument();
    });

    it('should render mobile menu button', () => {
      render(<AppNav />);
      const menuButton = screen.getByLabelText(/toggle menu/i);
      expect(menuButton).toBeInTheDocument();
    });
  });

  describe('Authenticated state', () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      avatarUrl: 'https://example.com/avatar.jpg',
      accountRole: 'USER' as const,
      accountType: 'GOOGLE' as const,
    };

    beforeEach(() => {
      mockUseAuthSession.mockReturnValue({
        data: {
          user: mockUser,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        status: 'authenticated',
        update: jest.fn(),
      });
    });

    it('should render authenticated navigation links', () => {
      render(<AppNav />);
      expect(screen.getByText(/Battle/i)).toBeInTheDocument();
      expect(screen.getByText(/Team Builder/i)).toBeInTheDocument();
    });

    it('should not render Sign In link', () => {
      render(<AppNav />);
      expect(screen.queryByText(/Sign In/i)).not.toBeInTheDocument();
    });

    it('should render user avatar and dropdown trigger', () => {
      render(<AppNav />);
      // Look for user avatar or profile trigger in desktop nav
      expect(
        screen.getByText(mockUser.username.charAt(0).toUpperCase())
      ).toBeInTheDocument();
    });
  });

  describe('Mobile menu functionality', () => {
    beforeEach(() => {
      mockUseAuthSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            accountRole: 'USER' as const,
            accountType: 'GOOGLE' as const,
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        status: 'authenticated',
        update: jest.fn(),
      });
    });

    it('should toggle mobile menu when menu button is clicked', () => {
      render(<AppNav />);
      const menuButton = screen.getByLabelText(/toggle menu/i);

      // Menu should be closed initially
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();

      // Open the menu
      fireEvent.click(menuButton);
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();

      // Close the menu
      fireEvent.click(menuButton);
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
    });

    it('should render mobile navigation items when menu is open', () => {
      render(<AppNav />);
      const menuButton = screen.getByLabelText(/toggle menu/i);

      fireEvent.click(menuButton);

      // Check for mobile-specific navigation items
      const mobileMenu = screen.getByTestId('mobile-menu');
      expect(mobileMenu).toBeInTheDocument();
    });
  });

  describe('Active path highlighting', () => {
    it('should highlight active navigation item', () => {
      mockUsePathname.mockReturnValue('/pokedex');
      mockUseAuthSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });

      render(<AppNav />);

      const pokedexButton = screen.getByRole('button', { name: /Pokedex/i });
      expect(pokedexButton).toBeDisabled();
    });
  });

  describe('Scroll behavior', () => {
    beforeEach(() => {
      mockUseAuthSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });
    });

    it('should add scroll event listener on mount', () => {
      render(<AppNav />);

      expect(window.addEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      );
    });

    it('should remove scroll event listener on unmount', () => {
      const { unmount } = render(<AppNav />);

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      );
    });

    it('should update scrolled state when scrolling', async () => {
      render(<AppNav />);

      // Get the scroll handler
      const scrollHandler = (
        window.addEventListener as jest.Mock
      ).mock.calls.find((call) => call[0] === 'scroll')[1];

      // Simulate scroll
      Object.defineProperty(window, 'scrollY', { value: 20, writable: true });

      act(() => {
        scrollHandler();
      });

      await waitFor(() => {
        const nav = screen.getByRole('navigation');
        expect(nav).toHaveClass('glass');
      });
    });
  });
});
