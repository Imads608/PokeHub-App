import { useEffect, useState } from 'react';
import useLoadPokedexEntries from './useLoadPokedexEntries';

const useInfiniteLoad = (typeData) => {
  const [enableLoad, setEnableLoad] = useState(false);
  const [currPageIndex, setCurrPageIndex] = useState(0);
  const [bottomReached, setBottomReached] = useState(false);

  const dexQueryRes = useLoadPokedexEntries(
    typeData === 'DexEntries' && enableLoad
  );
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    isLoading,
  } = dexQueryRes;

  useEffect(() => {
    if (!(!hasNextPage || isFetchingNextPage) && bottomReached) {
      fetchNextPage();
      setCurrPageIndex(currPageIndex + 1);
    }
    if (!data || (data && data.pages.length === currPageIndex + 1))
      setEnableLoad(true);
  }, [bottomReached]);

  const getNormalizedData = () => {
    let results = [];
    data &&
      data.pages.forEach((page, index) => {
        if (index <= currPageIndex) results.push(...page.results);
      });
    return results;
  };

  return {
    setBottomReached,
    data: getNormalizedData(),
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    isLoading,
  };
};

export default useInfiniteLoad;
