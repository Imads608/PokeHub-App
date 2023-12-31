import { useQuery, useInfiniteQuery } from 'react-query';
import { getPokedexData } from '../api/dex';

const useGenerationsLoad = (enable) => {
  /*const useQueryResult = useQuery('pokedex', () => getPokedexData(), 
                                    { enabled: enable ? true : false, refetchOnWindowFocus: false, refetchOnMount: false, staleTime: Infinity,
    });*/

  const useInfiniteQueryResult = useInfiniteQuery('pokemon', getPokedexData, {
    enabled: enable ? true : false,
    getNextPageParam: (lastPage, pages) => {
      //console.log('IN Next Page Param', lastPage, pages);
      return pages.length;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return useInfiniteQueryResult;
};

export default useGenerationsLoad;
