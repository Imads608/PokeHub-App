import {
  createMockTeams,
  createMockUseTeamViewerFiltersReturn,
} from '../../../test-utils/team-viewer-test-utils';
import { useTeamViewerFilters } from '../context/team-viewer.context';
import { useFilteredTeams } from './useFilteredTeams';
import { getFormatDisplayName } from '@pokehub/frontend/dex-data-provider';
import { renderHook } from '@testing-library/react';

jest.mock('../context/team-viewer.context');
jest.mock('@pokehub/frontend/dex-data-provider');

const mockUseTeamViewerFilters = useTeamViewerFilters as jest.MockedFunction<
  typeof useTeamViewerFilters
>;
const mockGetFormatDisplayName = getFormatDisplayName as jest.MockedFunction<
  typeof getFormatDisplayName
>;

describe('useFilteredTeams', () => {
  const mockTeams = createMockTeams(5);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTeamViewerFilters.mockReturnValue(
      createMockUseTeamViewerFiltersReturn()
    );
    mockGetFormatDisplayName.mockImplementation((_gen, format) => {
      const formatMap: Record<string, string> = {
        ou: 'OU',
        vgc2024rege: 'VGC 2024 Reg E',
        vgc2022: 'VGC 2022',
      };
      return formatMap[format] || format;
    });
  });

  describe('when teams is undefined', () => {
    it('should return empty array', () => {
      const { result } = renderHook(() => useFilteredTeams(undefined));
      expect(result.current).toEqual([]);
    });
  });

  describe('when teams is empty array', () => {
    it('should return empty array', () => {
      const { result } = renderHook(() => useFilteredTeams([]));
      expect(result.current).toEqual([]);
    });
  });

  describe('search filtering', () => {
    it('should return all teams when search term is empty', () => {
      const { result } = renderHook(() => useFilteredTeams(mockTeams));
      expect(result.current).toHaveLength(5);
    });

    it('should filter teams by name (case-insensitive)', () => {
      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          searchTerm: { value: 'alpha', setValue: jest.fn() },
        })
      );

      const { result } = renderHook(() => useFilteredTeams(mockTeams));

      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('Alpha Team');
    });

    it('should filter teams by partial name match', () => {
      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          searchTerm: { value: 'Team', setValue: jest.fn() },
        })
      );

      const { result } = renderHook(() => useFilteredTeams(mockTeams));

      expect(result.current).toHaveLength(5);
    });

    it('should return empty array when no teams match search', () => {
      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          searchTerm: { value: 'NonExistent', setValue: jest.fn() },
        })
      );

      const { result } = renderHook(() => useFilteredTeams(mockTeams));

      expect(result.current).toHaveLength(0);
    });
  });

  describe('generation filtering', () => {
    it('should return all teams when generation is "all"', () => {
      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          selectedGeneration: { value: 'all', setValue: jest.fn() },
        })
      );

      const { result } = renderHook(() => useFilteredTeams(mockTeams));

      expect(result.current).toHaveLength(5);
    });

    it('should filter teams by generation 9', () => {
      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          selectedGeneration: { value: 9, setValue: jest.fn() },
        })
      );

      const { result } = renderHook(() => useFilteredTeams(mockTeams));

      expect(result.current).toHaveLength(2);
      expect(result.current.every((team) => team.generation === 9)).toBe(true);
    });

    it('should filter teams by generation 8', () => {
      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          selectedGeneration: { value: 8, setValue: jest.fn() },
        })
      );

      const { result } = renderHook(() => useFilteredTeams(mockTeams));

      expect(result.current).toHaveLength(2);
      expect(result.current.every((team) => team.generation === 8)).toBe(true);
    });

    it('should filter teams by generation 7', () => {
      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          selectedGeneration: { value: 7, setValue: jest.fn() },
        })
      );

      const { result } = renderHook(() => useFilteredTeams(mockTeams));

      expect(result.current).toHaveLength(1);
      expect(result.current[0].generation).toBe(7);
    });
  });

  describe('format filtering', () => {
    it('should return all teams when format is "all"', () => {
      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          selectedFormat: { value: 'all', setValue: jest.fn() },
        })
      );

      const { result } = renderHook(() => useFilteredTeams(mockTeams));

      expect(result.current).toHaveLength(5);
    });

    it('should filter teams by format', () => {
      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          selectedFormat: { value: 'OU', setValue: jest.fn() },
        })
      );

      const { result } = renderHook(() => useFilteredTeams(mockTeams));

      expect(result.current).toHaveLength(3);
      expect(result.current.every((team) => team.format === 'ou')).toBe(true);
    });

    it('should filter teams by VGC format', () => {
      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          selectedFormat: { value: 'VGC 2024 Reg E', setValue: jest.fn() },
        })
      );

      const { result } = renderHook(() => useFilteredTeams(mockTeams));

      expect(result.current).toHaveLength(1);
      expect(result.current[0].format).toBe('vgc2024rege');
    });
  });

  describe('sorting', () => {
    describe('by name', () => {
      it('should sort teams alphabetically (asc)', () => {
        mockUseTeamViewerFilters.mockReturnValue(
          createMockUseTeamViewerFiltersReturn({
            sortBy: { value: 'name', setValue: jest.fn() },
            sortOrder: {
              value: 'asc',
              setValue: jest.fn(),
              toggleSortOrder: jest.fn(),
            },
          })
        );

        const { result } = renderHook(() => useFilteredTeams(mockTeams));

        const names = result.current.map((team) => team.name);
        expect(names).toEqual([
          'Alpha Team',
          'Beta Team',
          'Delta Team',
          'Epsilon Team',
          'Gamma Team',
        ]);
      });

      it('should sort teams reverse alphabetically (desc)', () => {
        mockUseTeamViewerFilters.mockReturnValue(
          createMockUseTeamViewerFiltersReturn({
            sortBy: { value: 'name', setValue: jest.fn() },
            sortOrder: {
              value: 'desc',
              setValue: jest.fn(),
              toggleSortOrder: jest.fn(),
            },
          })
        );

        const { result } = renderHook(() => useFilteredTeams(mockTeams));

        const names = result.current.map((team) => team.name);
        expect(names).toEqual([
          'Gamma Team',
          'Epsilon Team',
          'Delta Team',
          'Beta Team',
          'Alpha Team',
        ]);
      });
    });

    describe('by created date', () => {
      it('should sort teams by creation date (asc)', () => {
        mockUseTeamViewerFilters.mockReturnValue(
          createMockUseTeamViewerFiltersReturn({
            sortBy: { value: 'created', setValue: jest.fn() },
            sortOrder: {
              value: 'asc',
              setValue: jest.fn(),
              toggleSortOrder: jest.fn(),
            },
          })
        );

        const { result } = renderHook(() => useFilteredTeams(mockTeams));

        const names = result.current.map((team) => team.name);
        expect(names).toEqual([
          'Alpha Team',
          'Epsilon Team',
          'Delta Team',
          'Beta Team',
          'Gamma Team',
        ]);
      });

      it('should sort teams by creation date (desc)', () => {
        mockUseTeamViewerFilters.mockReturnValue(
          createMockUseTeamViewerFiltersReturn({
            sortBy: { value: 'created', setValue: jest.fn() },
            sortOrder: {
              value: 'desc',
              setValue: jest.fn(),
              toggleSortOrder: jest.fn(),
            },
          })
        );

        const { result } = renderHook(() => useFilteredTeams(mockTeams));

        const names = result.current.map((team) => team.name);
        expect(names).toEqual([
          'Gamma Team',
          'Beta Team',
          'Delta Team',
          'Epsilon Team',
          'Alpha Team',
        ]);
      });
    });

    describe('by updated date', () => {
      it('should sort teams by update date (asc)', () => {
        mockUseTeamViewerFilters.mockReturnValue(
          createMockUseTeamViewerFiltersReturn({
            sortBy: { value: 'updated', setValue: jest.fn() },
            sortOrder: {
              value: 'asc',
              setValue: jest.fn(),
              toggleSortOrder: jest.fn(),
            },
          })
        );

        const { result } = renderHook(() => useFilteredTeams(mockTeams));

        const names = result.current.map((team) => team.name);
        expect(names).toEqual([
          'Delta Team',
          'Beta Team',
          'Gamma Team',
          'Alpha Team',
          'Epsilon Team',
        ]);
      });

      it('should sort teams by update date (desc) - most recent first', () => {
        mockUseTeamViewerFilters.mockReturnValue(
          createMockUseTeamViewerFiltersReturn({
            sortBy: { value: 'updated', setValue: jest.fn() },
            sortOrder: {
              value: 'desc',
              setValue: jest.fn(),
              toggleSortOrder: jest.fn(),
            },
          })
        );

        const { result } = renderHook(() => useFilteredTeams(mockTeams));

        const names = result.current.map((team) => team.name);
        expect(names).toEqual([
          'Epsilon Team',
          'Alpha Team',
          'Gamma Team',
          'Beta Team',
          'Delta Team',
        ]);
      });
    });
  });

  describe('combined filters', () => {
    it('should apply search and generation filters together', () => {
      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          searchTerm: { value: 'Team', setValue: jest.fn() },
          selectedGeneration: { value: 9, setValue: jest.fn() },
        })
      );

      const { result } = renderHook(() => useFilteredTeams(mockTeams));

      expect(result.current).toHaveLength(2);
      expect(result.current.every((team) => team.generation === 9)).toBe(true);
    });

    it('should apply search, generation, and format filters together', () => {
      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          searchTerm: { value: 'Team', setValue: jest.fn() },
          selectedGeneration: { value: 9, setValue: jest.fn() },
          selectedFormat: { value: 'OU', setValue: jest.fn() },
        })
      );

      const { result } = renderHook(() => useFilteredTeams(mockTeams));

      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('Alpha Team');
    });

    it('should apply all filters and sorting together', () => {
      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          searchTerm: { value: 'Team', setValue: jest.fn() },
          selectedGeneration: { value: 'all', setValue: jest.fn() },
          selectedFormat: { value: 'OU', setValue: jest.fn() },
          sortBy: { value: 'name', setValue: jest.fn() },
          sortOrder: {
            value: 'asc',
            setValue: jest.fn(),
            toggleSortOrder: jest.fn(),
          },
        })
      );

      const { result } = renderHook(() => useFilteredTeams(mockTeams));

      expect(result.current).toHaveLength(3);
      const names = result.current.map((team) => team.name);
      expect(names).toEqual(['Alpha Team', 'Epsilon Team', 'Gamma Team']);
    });
  });

  describe('edge cases', () => {
    it('should handle teams without createdAt date', () => {
      const teamsWithMissingDates = [
        { ...mockTeams[0], createdAt: undefined },
        { ...mockTeams[1] },
      ];

      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          sortBy: { value: 'created', setValue: jest.fn() },
          sortOrder: {
            value: 'asc',
            setValue: jest.fn(),
            toggleSortOrder: jest.fn(),
          },
        })
      );

      const { result } = renderHook(() =>
        useFilteredTeams(teamsWithMissingDates)
      );

      expect(result.current).toHaveLength(2);
      expect(result.current[0].name).toBe('Alpha Team');
    });

    it('should handle teams without updatedAt date', () => {
      const teamsWithMissingDates = [
        { ...mockTeams[0], updatedAt: undefined },
        { ...mockTeams[1] },
      ];

      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          sortBy: { value: 'updated', setValue: jest.fn() },
          sortOrder: {
            value: 'asc',
            setValue: jest.fn(),
            toggleSortOrder: jest.fn(),
          },
        })
      );

      const { result } = renderHook(() =>
        useFilteredTeams(teamsWithMissingDates)
      );

      expect(result.current).toHaveLength(2);
      expect(result.current[0].name).toBe('Alpha Team');
    });

    it('should not mutate original array', () => {
      const originalTeams = [...mockTeams];

      mockUseTeamViewerFilters.mockReturnValue(
        createMockUseTeamViewerFiltersReturn({
          sortBy: { value: 'name', setValue: jest.fn() },
          sortOrder: {
            value: 'asc',
            setValue: jest.fn(),
            toggleSortOrder: jest.fn(),
          },
        })
      );

      renderHook(() => useFilteredTeams(mockTeams));

      expect(mockTeams).toEqual(originalTeams);
    });
  });
});
