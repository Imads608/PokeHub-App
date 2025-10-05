import { usePokemonDexDetailsContext } from '../context/pokemon-dex-details.context';
import { PokemonEvoTab } from './evo/evo-tab';
import { PokemonMovesTab } from './moves/moves-tab';
import { PokemonStatsTab } from './stats/stats-tab';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@pokehub/frontend/shared-ui-components';

export const PokemonTabsContainer = () => {
  const { selectedTab } = usePokemonDexDetailsContext();
  return (
    <Tabs
      defaultValue="stats"
      value={selectedTab.value.toLowerCase()}
      className="mb-8"
    >
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
        <TabsTrigger
          onClick={() => selectedTab.setValue('Stats')}
          value="stats"
        >
          Stats
        </TabsTrigger>
        <TabsTrigger
          onClick={() => selectedTab.setValue('Evolution')}
          value="evolution"
        >
          Evolution
        </TabsTrigger>
        <TabsTrigger
          onClick={() => selectedTab.setValue('Moves')}
          value="moves"
        >
          Moves
        </TabsTrigger>
      </TabsList>
      <PokemonStatsTab />
      <PokemonEvoTab />
      <PokemonMovesTab />
    </Tabs>
  );
};
