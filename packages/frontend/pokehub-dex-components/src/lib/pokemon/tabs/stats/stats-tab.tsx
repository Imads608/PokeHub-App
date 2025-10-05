import { AbilitiesCard } from './abilities-card';
import { StatsCard } from './stats-card';
import { TypeEffectivenessCard } from './type-effectiveness-card';
import { TabsContent } from '@pokehub/frontend/shared-ui-components';

export const PokemonStatsTab = () => {
  return (
    <TabsContent value="stats" className="mt-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <StatsCard />
        <TypeEffectivenessCard />
        <AbilitiesCard />
      </div>
    </TabsContent>
  );
};
