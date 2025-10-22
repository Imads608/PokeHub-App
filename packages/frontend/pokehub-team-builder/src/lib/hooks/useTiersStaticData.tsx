import {
  getSinglesBattleTiers,
  getDoublesBattleTiers,
} from '@pokehub/frontend/pokemon-static-data';
import { useMemo } from 'react';

export const useTiersStaticData = () => {
  const singlesTiers = useMemo(
    () =>
      getSinglesBattleTiers({
        excludeBanlist: true,
        excludeTechnicality: true,
      }),
    []
  );
  const doublesTiers = useMemo(
    () =>
      getDoublesBattleTiers({
        excludeBanlist: true,
        excludeTechnicality: true,
      }),
    []
  );

  const allFormatTier = useMemo(
    () => ({ id: 'all', name: 'All', description: 'All Formats' }),
    []
  );

  const allTiers = useMemo(() => [...singlesTiers, ...doublesTiers], []);

  return { singlesTiers, doublesTiers, allFormatTier, allTiers };
};
