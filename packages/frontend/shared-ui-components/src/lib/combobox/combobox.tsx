'use client';

import { cn } from '../utils';
import { Check, ChevronDown, ChevronRight, Search } from 'lucide-react';
import * as React from 'react';
import { Button } from '../button/button';
import { Input } from '../input/input';
import { Popover, PopoverContent, PopoverTrigger } from '../popover/popover';
import { ScrollArea } from '../scroll-area/scroll-area';

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

export interface ComboboxGroup {
  category: string;
  options: ComboboxOption[];
  defaultExpanded?: boolean;
}

export interface ComboboxProps {
  /** Current selected value */
  value?: string;
  /** Callback when value changes */
  onValueChange?: (value: string) => void;
  /** Grouped options to display */
  groups: ComboboxGroup[];
  /** Placeholder text for the trigger button */
  placeholder?: string;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /** Text to show when no results found */
  emptyText?: string;
  /** Whether the combobox is disabled */
  disabled?: boolean;
  /** Custom className for the trigger button */
  className?: string;
}

/**
 * Combobox with searchable, grouped, and collapsible options
 *
 * @example
 * ```tsx
 * <Combobox
 *   value={selectedFormat}
 *   onValueChange={setSelectedFormat}
 *   placeholder="Select format..."
 *   searchPlaceholder="Search formats..."
 *   groups={[
 *     {
 *       category: 'Singles',
 *       options: [
 *         { value: 'ou', label: 'OU', description: 'OverUsed' },
 *         { value: 'uu', label: 'UU' },
 *       ],
 *       defaultExpanded: true,
 *     },
 *     {
 *       category: 'Doubles',
 *       options: [{ value: 'doublesou', label: 'Doubles OU' }],
 *     },
 *   ]}
 * />
 * ```
 */
export const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      value,
      onValueChange,
      groups,
      placeholder = 'Select option...',
      searchPlaceholder = 'Search...',
      emptyText = 'No results found.',
      disabled = false,
      className,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [expandedCategories, setExpandedCategories] = React.useState<
      Set<string>
    >(() => {
      // Initialize with categories that should be expanded by default
      const initialExpanded = new Set<string>();
      groups.forEach((group) => {
        if (group.defaultExpanded !== false) {
          // Expand by default unless explicitly set to false
          initialExpanded.add(group.category);
        }
      });
      return initialExpanded;
    });

    // Get the selected option label
    const selectedOption = React.useMemo(() => {
      for (const group of groups) {
        const option = group.options.find((opt) => opt.value === value);
        if (option) return option;
      }
      return null;
    }, [groups, value]);

    // Filter and search logic
    const filteredGroups = React.useMemo(() => {
      if (!search.trim()) {
        return groups;
      }

      const lowerSearch = search.toLowerCase();
      const filtered: ComboboxGroup[] = [];

      for (const group of groups) {
        const matchingOptions = group.options.filter(
          (option) =>
            option.label.toLowerCase().includes(lowerSearch) ||
            option.value.toLowerCase().includes(lowerSearch) ||
            option.description?.toLowerCase().includes(lowerSearch) ||
            group.category.toLowerCase().includes(lowerSearch)
        );

        if (matchingOptions.length > 0) {
          filtered.push({
            ...group,
            options: matchingOptions,
          });
        }
      }

      return filtered;
    }, [groups, search]);

    // Auto-expand categories with search results
    React.useEffect(() => {
      if (search.trim()) {
        // When searching, expand all categories with results
        const categoriesToExpand = new Set<string>();
        filteredGroups.forEach((group) => {
          if (group.options.length > 0) {
            categoriesToExpand.add(group.category);
          }
        });
        setExpandedCategories(categoriesToExpand);
      }
    }, [search, filteredGroups]);

    const toggleCategory = (category: string) => {
      setExpandedCategories((prev) => {
        const next = new Set(prev);
        if (next.has(category)) {
          next.delete(category);
        } else {
          next.add(category);
        }
        return next;
      });
    };

    const handleSelect = (optionValue: string) => {
      onValueChange?.(optionValue);
      setOpen(false);
      setSearch('');
    };

    const hasResults = filteredGroups.length > 0;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn('w-full justify-between', className)}
          >
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-2" align="start">
          <div className="flex flex-col gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Options List */}
            <ScrollArea className="h-[400px]">
              <div className="pr-4">
                {!hasResults && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {emptyText}
                  </div>
                )}

                {hasResults && (
                  <div className="space-y-1">
                  {filteredGroups.map((group) => {
                    const isExpanded = expandedCategories.has(group.category);

                    return (
                      <div key={group.category}>
                        {/* Category Header */}
                        <button
                          type="button"
                          onClick={() => toggleCategory(group.category)}
                          className="flex w-full items-center gap-1 rounded-sm px-2 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                          <span className="uppercase">{group.category}</span>
                          <span className="ml-auto text-xs">
                            ({group.options.length})
                          </span>
                        </button>

                        {/* Category Options */}
                        {isExpanded && (
                          <div className="ml-4 space-y-0.5">
                            {group.options.map((option) => {
                              const isSelected = value === option.value;

                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => handleSelect(option.value)}
                                  className={cn(
                                    'flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
                                    'hover:bg-accent hover:text-accent-foreground',
                                    isSelected && 'bg-accent text-accent-foreground'
                                  )}
                                >
                                  <div className="flex h-4 w-4 shrink-0 items-center justify-center">
                                    {isSelected && <Check className="h-4 w-4" />}
                                  </div>
                                  <div className="flex flex-col items-start gap-0.5">
                                    <span className="font-medium">
                                      {option.label}
                                    </span>
                                    {option.description && (
                                      <span className="text-xs text-muted-foreground">
                                        {option.description}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

Combobox.displayName = 'Combobox';
