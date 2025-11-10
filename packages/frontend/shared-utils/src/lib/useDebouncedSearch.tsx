import { useEffect, useState } from 'react';

export interface DebouncedSearchProps {
  initialVal: string;
}

export const useDebouncedSearch = ({ initialVal }: DebouncedSearchProps) => {
  const [searchTerm, setSearchTerm] = useState(initialVal);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(handler);
  }, [searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
  };
};
