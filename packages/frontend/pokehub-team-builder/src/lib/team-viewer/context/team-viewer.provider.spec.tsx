import { renderHook, act } from '@testing-library/react';
import { TeamViewerProvider } from './team-viewer.provider';
import { useTeamViewerFilters } from './team-viewer.context';
import type { GenerationNum } from '@pkmn/dex';

describe('TeamViewerProvider', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TeamViewerProvider>{children}</TeamViewerProvider>
  );

  describe('initial state', () => {
    it('should have empty search term', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });
      expect(result.current.searchTerm.value).toBe('');
    });

    it('should have "all" as selected generation', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });
      expect(result.current.selectedGeneration.value).toBe('all');
    });

    it('should have "all" as selected format', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });
      expect(result.current.selectedFormat.value).toBe('all');
    });

    it('should have "updated" as default sortBy', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });
      expect(result.current.sortBy.value).toBe('updated');
    });

    it('should have "desc" as default sortOrder', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });
      expect(result.current.sortOrder.value).toBe('desc');
    });

    it('should have "grid" as default viewMode', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });
      expect(result.current.viewMode.value).toBe('grid');
    });

    it('should not have active filters', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });
      expect(result.current.hasActiveFilters).toBe(false);
    });
  });

  describe('searchTerm', () => {
    it('should update search term', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });

      act(() => {
        result.current.searchTerm.setValue('test search');
      });

      expect(result.current.searchTerm.value).toBe('test search');
    });

    it('should set hasActiveFilters to true when search term is not empty', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });

      act(() => {
        result.current.searchTerm.setValue('test');
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });
  });

  describe('selectedGeneration', () => {
    it('should update selected generation', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });

      act(() => {
        result.current.selectedGeneration.setValue(9 as GenerationNum);
      });

      expect(result.current.selectedGeneration.value).toBe(9);
    });

    it('should set hasActiveFilters to true when generation is not "all"', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });

      act(() => {
        result.current.selectedGeneration.setValue(8 as GenerationNum);
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });
  });

  describe('selectedFormat', () => {
    it('should update selected format', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });

      act(() => {
        result.current.selectedFormat.setValue('OU');
      });

      expect(result.current.selectedFormat.value).toBe('OU');
    });

    it('should set hasActiveFilters to true when format is not "all"', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });

      act(() => {
        result.current.selectedFormat.setValue('VGC 2024');
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });
  });

  describe('sortBy', () => {
    it('should update sortBy to "name"', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });

      act(() => {
        result.current.sortBy.setValue('name');
      });

      expect(result.current.sortBy.value).toBe('name');
    });

    it('should update sortBy to "created"', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });

      act(() => {
        result.current.sortBy.setValue('created');
      });

      expect(result.current.sortBy.value).toBe('created');
    });
  });

  describe('sortOrder', () => {
    it('should update sortOrder', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });

      act(() => {
        result.current.sortOrder.setValue('asc');
      });

      expect(result.current.sortOrder.value).toBe('asc');
    });

    it('should toggle sortOrder from desc to asc', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });

      expect(result.current.sortOrder.value).toBe('desc');

      act(() => {
        result.current.sortOrder.toggleSortOrder();
      });

      expect(result.current.sortOrder.value).toBe('asc');
    });

    it('should toggle sortOrder from asc to desc', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });

      act(() => {
        result.current.sortOrder.setValue('asc');
      });

      act(() => {
        result.current.sortOrder.toggleSortOrder();
      });

      expect(result.current.sortOrder.value).toBe('desc');
    });
  });

  describe('viewMode', () => {
    it('should update viewMode', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });

      act(() => {
        result.current.viewMode.setValue('list');
      });

      expect(result.current.viewMode.value).toBe('list');
    });

    it('should toggle viewMode from grid to list', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });

      expect(result.current.viewMode.value).toBe('grid');

      act(() => {
        result.current.viewMode.toggleViewMode();
      });

      expect(result.current.viewMode.value).toBe('list');
    });

    it('should toggle viewMode from list to grid', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });

      act(() => {
        result.current.viewMode.setValue('list');
      });

      act(() => {
        result.current.viewMode.toggleViewMode();
      });

      expect(result.current.viewMode.value).toBe('grid');
    });
  });

  describe('resetFilters', () => {
    it('should reset all filters to default values', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });

      act(() => {
        result.current.searchTerm.setValue('test search');
        result.current.selectedGeneration.setValue(9 as GenerationNum);
        result.current.selectedFormat.setValue('OU');
        result.current.sortBy.setValue('name');
        result.current.sortOrder.setValue('asc');
      });

      expect(result.current.hasActiveFilters).toBe(true);

      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.searchTerm.value).toBe('');
      expect(result.current.selectedGeneration.value).toBe('all');
      expect(result.current.selectedFormat.value).toBe('all');
      expect(result.current.sortBy.value).toBe('updated');
      expect(result.current.sortOrder.value).toBe('desc');
      expect(result.current.hasActiveFilters).toBe(false);
    });

    it('should not reset viewMode', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });

      act(() => {
        result.current.viewMode.setValue('list');
        result.current.searchTerm.setValue('test');
      });

      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.viewMode.value).toBe('list');
    });
  });

  describe('hasActiveFilters', () => {
    it('should be true when only searchTerm is active', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });

      act(() => {
        result.current.searchTerm.setValue('test');
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('should be true when only selectedGeneration is active', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });

      act(() => {
        result.current.selectedGeneration.setValue(9 as GenerationNum);
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('should be true when only selectedFormat is active', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });

      act(() => {
        result.current.selectedFormat.setValue('OU');
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('should be true when multiple filters are active', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });

      act(() => {
        result.current.searchTerm.setValue('test');
        result.current.selectedGeneration.setValue(9 as GenerationNum);
        result.current.selectedFormat.setValue('OU');
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('should be false when sortBy and sortOrder are changed but no filters', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });

      act(() => {
        result.current.sortBy.setValue('name');
        result.current.sortOrder.setValue('asc');
      });

      expect(result.current.hasActiveFilters).toBe(false);
    });

    it('should be false when viewMode is changed but no filters', () => {
      const { result } = renderHook(() => useTeamViewerFilters(), { wrapper });

      act(() => {
        result.current.viewMode.setValue('list');
      });

      expect(result.current.hasActiveFilters).toBe(false);
    });
  });
});
