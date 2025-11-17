import { SearchableSelect } from './searchable-select';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock hooks
jest.mock('@pokehub/frontend/shared-utils');

const mockSetSearchTerm = jest.fn();
const mockHandleScroll = jest.fn();

// Get mocked hooks after mock is set up
const { useDebouncedSearch: mockUseDebouncedSearch, useInfiniteScroll: mockUseInfiniteScroll } =
  jest.requireMock('@pokehub/frontend/shared-utils') as {
    useDebouncedSearch: jest.Mock;
    useInfiniteScroll: jest.Mock;
  };

describe('SearchableSelect', () => {
  const mockItems = [
    { name: 'Pikachu', desc: 'Electric Mouse Pokemon' },
    { name: 'Charizard', desc: 'Fire/Flying Pokemon' },
    { name: 'Bulbasaur', desc: 'Grass/Poison Pokemon' },
    { name: 'Squirtle', desc: 'Water Pokemon' },
  ];

  const defaultProps = {
    id: 'test-select',
    label: 'Pokemon',
    placeholder: 'Select a Pokemon',
    value: undefined,
    items: mockItems,
    onValueChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock implementations
    mockUseDebouncedSearch.mockReturnValue({
      searchTerm: '',
      setSearchTerm: mockSetSearchTerm,
      debouncedSearchTerm: '',
      isDebouncing: false,
    });

    mockUseInfiniteScroll.mockReturnValue({
      itemsToShow: 50,
      handleScroll: mockHandleScroll,
      resetScroll: jest.fn(),
    });
  });

  describe('Rendering', () => {
    it('should render label', () => {
      render(<SearchableSelect {...defaultProps} />);

      expect(screen.getByText('Pokemon')).toBeInTheDocument();
    });

    it('should render trigger button with placeholder when no value selected', () => {
      render(<SearchableSelect {...defaultProps} />);

      expect(screen.getByRole('combobox')).toHaveTextContent('Select a Pokemon');
    });

    it('should render trigger button with selected item when value is provided', () => {
      render(<SearchableSelect {...defaultProps} value="Pikachu" />);

      expect(screen.getByRole('combobox')).toHaveTextContent('Pikachu');
    });

    it('should have correct id on trigger button', () => {
      render(<SearchableSelect {...defaultProps} />);

      expect(screen.getByRole('combobox')).toHaveAttribute('id', 'test-select');
    });
  });

  describe('Popover Interaction', () => {
    it('should open popover when trigger is clicked', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      // Search input should appear
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search pokemon...')).toBeInTheDocument();
      });
    });

    it('should display all items when popover opens', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Pikachu')).toBeInTheDocument();
        expect(screen.getByText('Charizard')).toBeInTheDocument();
        expect(screen.getByText('Bulbasaur')).toBeInTheDocument();
        expect(screen.getByText('Squirtle')).toBeInTheDocument();
      });
    });

    it('should display item descriptions', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Electric Mouse Pokemon')).toBeInTheDocument();
        expect(screen.getByText('Fire/Flying Pokemon')).toBeInTheDocument();
      });
    });
  });

  describe('Item Selection', () => {
    it('should call onValueChange when item is clicked', async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      render(<SearchableSelect {...defaultProps} onValueChange={onValueChange} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Pikachu')).toBeInTheDocument();
      });

      const pikachuButton = screen.getByText('Pikachu').closest('button');
      if (pikachuButton) {
        await user.click(pikachuButton);
      }

      expect(onValueChange).toHaveBeenCalledWith('Pikachu');
    });

    it('should highlight selected item with Check icon', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} value="Pikachu" />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        // Get all elements with "Pikachu" text (appears in trigger and in list)
        const pikachuElements = screen.getAllByText('Pikachu');
        // The second one should be in the item list
        const pikachuButton = pikachuElements[1]?.closest('button');
        // Check icon should have opacity-100 class
        const checkIcon = pikachuButton?.querySelector('.opacity-100');
        expect(checkIcon).toBeInTheDocument();
      });
    });

    it('should not highlight unselected items', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} value="Pikachu" />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        const charizardButton = screen.getByText('Charizard').closest('button');
        // Check icon should have opacity-0 class
        const checkIcon = charizardButton?.querySelector('.opacity-0');
        expect(checkIcon).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should render search input in popover', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search pokemon...')).toBeInTheDocument();
      });
    });

    it('should call setSearchTerm when typing in search input', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search pokemon...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search pokemon...');
      await user.type(searchInput, 'Pika');

      expect(mockSetSearchTerm).toHaveBeenCalled();
    });

    it('should filter items based on debounced search term', async () => {
      mockUseDebouncedSearch.mockReturnValue({
        searchTerm: 'pika',
        setSearchTerm: mockSetSearchTerm,
        debouncedSearchTerm: 'pika',
        isDebouncing: false,
      });

      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        // Should show Pikachu
        expect(screen.getByText('Pikachu')).toBeInTheDocument();
        // Should not show Charizard
        expect(screen.queryByText('Charizard')).not.toBeInTheDocument();
      });
    });

    it('should show "No items found" when search returns no results', async () => {
      mockUseDebouncedSearch.mockReturnValue({
        searchTerm: 'xyz',
        setSearchTerm: mockSetSearchTerm,
        debouncedSearchTerm: 'xyz',
        isDebouncing: false,
      });

      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('No pokemon found.')).toBeInTheDocument();
      });
    });

    it('should use custom filterItems function if provided', async () => {
      const customFilter = jest.fn((items: typeof mockItems, searchTerm: string) =>
        items.filter((item: typeof mockItems[0]) => item.name.startsWith(searchTerm))
      );

      mockUseDebouncedSearch.mockReturnValue({
        searchTerm: 'P',
        setSearchTerm: mockSetSearchTerm,
        debouncedSearchTerm: 'P',
        isDebouncing: false,
      });

      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} filterItems={customFilter} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(customFilter).toHaveBeenCalled();
      });
    });
  });

  describe('Clear Functionality', () => {
    it('should render "None" button when onClear is provided', async () => {
      const user = userEvent.setup();
      const onClear = jest.fn();
      render(<SearchableSelect {...defaultProps} onClear={onClear} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('None')).toBeInTheDocument();
      });
    });

    it('should not render "None" button when onClear is not provided', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByText('None')).not.toBeInTheDocument();
      });
    });

    it('should call onClear when "None" is clicked', async () => {
      const user = userEvent.setup();
      const onClear = jest.fn();
      render(<SearchableSelect {...defaultProps} onClear={onClear} value="Pikachu" />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('None')).toBeInTheDocument();
      });

      const noneButton = screen.getByText('None');
      await user.click(noneButton);

      expect(onClear).toHaveBeenCalled();
    });

    it('should highlight "None" when no value is selected', async () => {
      const user = userEvent.setup();
      const onClear = jest.fn();
      render(<SearchableSelect {...defaultProps} onClear={onClear} value={undefined} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        const noneButton = screen.getByText('None').closest('button');
        // Check icon should have opacity-100 class
        const checkIcon = noneButton?.querySelector('.opacity-100');
        expect(checkIcon).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show skeleton loaders when isLoading is true', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} isLoading={true} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        // Should show 8 skeleton items (based on the component code)
        const skeletons = document.querySelectorAll('.h-4.w-4.shrink-0');
        expect(skeletons.length).toBeGreaterThanOrEqual(8);
      });
    });

    it('should not show items when isLoading is true', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} isLoading={true} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.queryByText('Pikachu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Custom Render Functions', () => {
    it('should use custom renderTriggerContent if provided', () => {
      const customRender = (item: typeof mockItems[0] | undefined) => (
        <span>Custom: {item?.name || 'None'}</span>
      );

      render(
        <SearchableSelect
          {...defaultProps}
          value="Pikachu"
          renderTriggerContent={customRender}
        />
      );

      expect(screen.getByText('Custom: Pikachu')).toBeInTheDocument();
    });

    it('should use custom renderItemContent if provided', async () => {
      const user = userEvent.setup();
      const customRender = (item: typeof mockItems[0], isSelected: boolean) => (
        <span>Custom Item: {item.name}</span>
      );

      render(
        <SearchableSelect
          {...defaultProps}
          renderItemContent={customRender}
        />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByText('Custom Item: Pikachu')).toBeInTheDocument();
      });
    });
  });

  describe('Dropdown Width', () => {
    it('should use default dropdown width when not provided', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        const popoverContent = document.querySelector('.w-\\[400px\\]');
        expect(popoverContent).toBeInTheDocument();
      });
    });

    it('should use custom dropdown width when provided', async () => {
      const user = userEvent.setup();
      render(<SearchableSelect {...defaultProps} dropdownWidth="w-[600px]" />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      await waitFor(() => {
        const popoverContent = document.querySelector('.w-\\[600px\\]');
        expect(popoverContent).toBeInTheDocument();
      });
    });
  });
});
