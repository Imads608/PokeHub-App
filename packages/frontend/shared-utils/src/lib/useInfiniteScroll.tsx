import { useState } from 'react';

export interface InfiniteScrollProps {
  itemsPerPage?: number;
  initialItems?: number;
}

export const useInfiniteScroll = ({
  itemsPerPage,
  initialItems,
}: InfiniteScrollProps) => {
  const [itemsToShow, setItemsToShow] = useState(initialItems || 50); // Initial number of items to display
  const itemsDisplayedPerPage = itemsPerPage || 20; // Number of items to load per scroll

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (
      target.scrollHeight - target.scrollTop <=
      target.clientHeight + 100 // Trigger 100px before bottom
    ) {
      setItemsToShow((prev) => prev + itemsDisplayedPerPage);
    }
  };

  const resetItems = () => {
    setItemsToShow(50);
  };

  return {
    handleScroll,
    itemsToShow,
    resetItems,
  };
};
