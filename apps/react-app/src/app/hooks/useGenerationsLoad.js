import { useQuery } from 'react-query';
import { getGenerations } from '../api/dex';

const useGenerationsLoad = (enable) => {
    const useQueryResult = useQuery('generations', () => getGenerations(), 
                                    { enabled: enable ? true : false, refetchOnWindowFocus: false, refetchOnMount: false, staleTime: Infinity,
    });

    return useQueryResult;
}

export default useGenerationsLoad;