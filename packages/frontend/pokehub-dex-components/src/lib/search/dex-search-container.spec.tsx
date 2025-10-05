import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DexSearchContainer } from './dex-search-container';
import { usePokedexSearch } from './hooks/usePokedexSearch';
import { useDexSearchFilters } from './context/dex-search.context';
import React from 'react';

// Mock the custom hooks
jest.mock('./hooks/usePokedexSearch');
jest.mock('./context/dex-search.context');

// Define the types for our mocked hooks
const mockUsePokedexSearch = usePokedexSearch as jest.Mock;
const mockUseDexSearchFilters = useDexSearchFilters as jest.Mock;

describe('DexSearchContainer', () => {
  // Create mock functions for state setters
  const mockSetSearchTerm = jest.fn();
  const mockSetSortBy = jest.fn();
  const mockToggleSortOrder = jest.fn();
  const mockResetFilters = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Provide a default mock implementation for the filters hook
    mockUseDexSearchFilters.mockReturnValue({
      searchTerm: { value: '', setValue: mockSetSearchTerm },
      types: { value: [] },
      generations: { value: [] },
      sortBy: { value: 'id', setValue: mockSetSortBy },
      sortOrder: { value: 'asc', toggleSortOrder: mockToggleSortOrder },
      resetFilters: mockResetFilters,
    });
  });

  it('should display a loading state', () => {
    // Arrange: Mock the search hook to be in a loading state
    mockUsePokedexSearch.mockReturnValue({
      isLoading: true,
      data: undefined,
    });

    // Act
    render(<DexSearchContainer />);

    // Assert: Check for the loading message
    const loadingHeading = screen.getByRole('heading', {
      name: /Loading Pokémon.../i,
    });
    expect(loadingHeading).toBeInTheDocument();
  });

  it('should display the list of Pokémon when data is loaded', () => {
    // Arrange: Mock the search hook to return data
    const fakePokemon = [
      { id: 'bulbasaur', name: 'Bulbasaur', num: 1, types: ['Grass', 'Poison'], baseStats: { hp: 45, atk: 49, def: 49 } },
      { id: 'charmander', name: 'Charmander', num: 4, types: ['Fire'], baseStats: { hp: 39, atk: 52, def: 43 } },
    ];
    mockUsePokedexSearch.mockReturnValue({
      isLoading: false,
      data: fakePokemon,
    });

    // Act
    render(<DexSearchContainer />);

    // Assert: Check that the Pokémon names are rendered
    expect(screen.getByRole('heading', { name: 'Bulbasaur' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Charmander' })).toBeInTheDocument();
    // Check that the loading message is gone
    expect(screen.queryByRole('heading', { name: /Loading Pokémon.../i })).not.toBeInTheDocument();
  });

  it('should update the input value when a user types', async () => {
    // Arrange
    const user = userEvent.setup();
    // For controlled components, we need a stateful wrapper to test the value.
    const TestWrapper = () => {
      const [term, setTerm] = React.useState('');
      // This mock will now update when setTerm is called
      mockUseDexSearchFilters.mockReturnValue({
        searchTerm: { value: term, setValue: setTerm },
        types: { value: [] },
        generations: { value: [] },
        sortBy: { value: 'id', setValue: jest.fn() },
        sortOrder: { value: 'asc', toggleSortOrder: jest.fn() },
        resetFilters: jest.fn(),
      });
      return <DexSearchContainer />;
    };

    mockUsePokedexSearch.mockReturnValue({ isLoading: false, data: [] });

    // Act
    render(<TestWrapper />);
    const searchInput = screen.getByPlaceholderText(/Search by name or number.../i);
    await user.type(searchInput, 'Pikachu');

    // Assert
    expect(searchInput).toHaveValue('Pikachu');
  });
});
