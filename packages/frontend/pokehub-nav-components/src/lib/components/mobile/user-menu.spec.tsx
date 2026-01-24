import { UserMenu } from './user-menu';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronLeft: () => <span data-testid="chevron-left-icon">ChevronLeft</span>,
  Settings: () => <span data-testid="settings-icon">Settings</span>,
}));

describe('UserMenu', () => {
  const mockSetShowProfileMenu = jest.fn();

  const defaultProps = {
    showProfileMenu: true,
    setShowProfileMenu: mockSetShowProfileMenu,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the user menu container', () => {
      render(<UserMenu {...defaultProps} />);

      // Settings text appears in both the icon mock and the menu item
      expect(screen.getAllByText('Settings').length).toBeGreaterThan(0);
    });

    it('should render back button with chevron icon', () => {
      render(<UserMenu {...defaultProps} />);

      expect(screen.getByTestId('chevron-left-icon')).toBeInTheDocument();
    });

    it('should render Settings link', () => {
      render(<UserMenu {...defaultProps} />);

      const settingsLink = screen.getByRole('link', { name: /settings/i });
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('should render settings icon', () => {
      render(<UserMenu {...defaultProps} />);

      expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
    });
  });

  describe('visibility states', () => {
    it('should have translate-x-0 class when showProfileMenu is true', () => {
      const { container } = render(<UserMenu {...defaultProps} />);

      const menuContainer = container.firstChild as HTMLElement;
      expect(menuContainer.className).toContain('translate-x-0');
      expect(menuContainer.className).not.toContain('translate-x-full');
    });

    it('should have translate-x-full class when showProfileMenu is false', () => {
      const { container } = render(
        <UserMenu {...defaultProps} showProfileMenu={false} />
      );

      const menuContainer = container.firstChild as HTMLElement;
      expect(menuContainer.className).toContain('translate-x-full');
      expect(menuContainer.className).not.toContain('translate-x-0');
    });
  });

  describe('interactions', () => {
    it('should call setShowProfileMenu with false when back button is clicked', () => {
      render(<UserMenu {...defaultProps} />);

      // Find the back button (contains the chevron icon)
      const backButton = screen
        .getByTestId('chevron-left-icon')
        .closest('button');
      if (backButton) {
        fireEvent.click(backButton);
      }

      expect(mockSetShowProfileMenu).toHaveBeenCalledWith(false);
    });

    it('should not call setShowProfileMenu when clicking Settings link', () => {
      render(<UserMenu {...defaultProps} />);

      const settingsLink = screen.getByRole('link', { name: /settings/i });
      fireEvent.click(settingsLink);

      // setShowProfileMenu should not be called when clicking the settings link
      expect(mockSetShowProfileMenu).not.toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('should have correct base classes on container', () => {
      const { container } = render(<UserMenu {...defaultProps} />);

      const menuContainer = container.firstChild as HTMLElement;
      expect(menuContainer.className).toContain('absolute');
      expect(menuContainer.className).toContain('h-full');
      expect(menuContainer.className).toContain('w-full');
      expect(menuContainer.className).toContain('bg-background');
      expect(menuContainer.className).toContain('transition-transform');
    });

    it('should have grid layout for menu items', () => {
      const { container } = render(<UserMenu {...defaultProps} />);

      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
    });
  });
});
