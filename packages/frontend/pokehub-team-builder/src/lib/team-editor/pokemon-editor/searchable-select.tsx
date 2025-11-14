import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from '@pokehub/frontend/shared-ui-components';
import {
  useDebouncedSearch,
  useInfiniteScroll,
} from '@pokehub/frontend/shared-utils';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface SearchableSelectItem {
  name: string;
  desc?: string;
}

interface SearchableSelectProps<T extends SearchableSelectItem> {
  id: string;
  label: string;
  placeholder: string;
  value: string | undefined;
  items: T[];
  onValueChange: (value: string) => void;
  onClear?: () => void;
  renderTriggerContent?: (selectedItem: T | undefined) => React.ReactNode;
  renderItemContent?: (item: T, isSelected: boolean) => React.ReactNode;
  filterItems?: (items: T[], searchTerm: string) => T[];
}

export function SearchableSelect<T extends SearchableSelectItem>({
  id,
  label,
  placeholder,
  value,
  items,
  onValueChange,
  onClear,
  renderTriggerContent,
  renderItemContent,
  filterItems,
}: SearchableSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const { searchTerm, setSearchTerm, debouncedSearchTerm } = useDebouncedSearch(
    { initialVal: '' }
  );
  const [filteredItems, setFilteredItems] = useState(items);
  const { itemsToShow, handleScroll } = useInfiniteScroll({});
  const hasScrolledRef = useRef(false);

  // Update filtered items when search changes
  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setFilteredItems(items);
    } else {
      const searchTermLower = debouncedSearchTerm.toLowerCase();
      const filtered = filterItems
        ? filterItems(items, searchTermLower)
        : items.filter((item) =>
            item.name.toLowerCase().includes(searchTermLower)
          );
      setFilteredItems(filtered);
    }
  }, [debouncedSearchTerm, items, filterItems]);

  // Reset scroll flag when popover opens
  useEffect(() => {
    if (isOpen) {
      hasScrolledRef.current = false;
    }
  }, [isOpen]);

  // Callback ref that scrolls to selected item
  const scrollToSelectedItem = (node: HTMLButtonElement | null) => {
    if (node && isOpen && !hasScrolledRef.current) {
      hasScrolledRef.current = true;
      node.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  const selectedItem = items.find((item) => item.name === value);

  const defaultRenderTriggerContent = () => {
    return selectedItem ? (
      <span>{selectedItem.name}</span>
    ) : (
      <span>{placeholder}</span>
    );
  };

  const defaultRenderItemContent = (item: T, isSelected: boolean) => {
    return (
      <>
        <Check
          className={`mr-2 h-4 w-4 shrink-0 ${
            isSelected ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div className="flex w-full items-center gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
            <span className="break-words font-medium group-hover:text-accent-foreground">
              {item.name}
            </span>
            {item.desc && (
              <span className="whitespace-normal break-words text-xs leading-tight text-muted-foreground group-hover:text-accent-foreground">
                {item.desc}
              </span>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </label>
      <Popover modal={true} open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="mt-1 h-11 w-full justify-between"
          >
            {renderTriggerContent
              ? renderTriggerContent(selectedItem)
              : defaultRenderTriggerContent()}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <ScrollArea className="h-[300px]" onScrollCapture={handleScroll}>
            <div className="p-1">
              {onClear && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    onClear();
                    setIsOpen(false);
                  }}
                  className="group relative flex h-auto w-full cursor-default select-none items-center justify-start rounded-sm px-2 py-3 text-sm font-normal outline-none hover:bg-accent hover:text-accent-foreground"
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      !value ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <span className="font-medium group-hover:text-accent-foreground">
                    None
                  </span>
                </Button>
              )}
              {filteredItems.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No {label.toLowerCase()} found.
                </div>
              ) : (
                filteredItems.slice(0, itemsToShow).map((item) => (
                  <Button
                    key={item.name}
                    ref={value === item.name ? scrollToSelectedItem : null}
                    variant="ghost"
                    onClick={() => {
                      onValueChange(item.name);
                      setIsOpen(false);
                    }}
                    className="group relative flex h-auto w-full cursor-default select-none items-center justify-start rounded-sm px-2 py-3 text-sm font-normal outline-none hover:bg-accent hover:text-accent-foreground"
                  >
                    {renderItemContent
                      ? renderItemContent(item, value === item.name)
                      : defaultRenderItemContent(item, value === item.name)}
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
