import { PokemonStatsTab } from './stats/stats-tab';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@pokehub/frontend/shared-ui-components';

export const PokemonTabsContainer = () => {
  return (
    <Tabs defaultValue="stats" className="mb-8">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
        <TabsTrigger value="stats">Stats</TabsTrigger>
        <TabsTrigger value="evolution">Evolution</TabsTrigger>
        <TabsTrigger value="moves">Moves</TabsTrigger>
        <TabsTrigger value="location">Location</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
      </TabsList>
      <PokemonStatsTab />
    </Tabs>
  );
};
