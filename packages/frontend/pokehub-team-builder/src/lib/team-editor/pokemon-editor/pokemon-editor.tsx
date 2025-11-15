'use client';

import { BasicTab } from './basic-tab';
import { EVsTab } from './evs-tab';
import { IVsTab } from './ivs-tab';
import { MovesTab } from './moves-tab';
import type { Species } from '@pkmn/dex';
import type { PokemonInTeam } from '@pokehub/frontend/pokemon-types';
import {
  Button,
  DialogFooter,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@pokehub/frontend/shared-ui-components';

interface PokemonEditorProps {
  activePokemon: PokemonInTeam;
  species: Species;
  addPokemon: () => void;
}

export function PokemonEditor({
  activePokemon,
  species,
  addPokemon,
}: PokemonEditorProps) {
  return (
    <>
      <Tabs defaultValue="basic">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="moves">Moves</TabsTrigger>
          <TabsTrigger value="evs">EVs</TabsTrigger>
          <TabsTrigger value="ivs">IVs</TabsTrigger>
        </TabsList>

        {/* Basic Tab */}
        <BasicTab species={species} pokemon={activePokemon} />

        {/* Moves Tab */}
        <MovesTab species={species} pokemon={activePokemon} />

        {/* EVs Tab */}
        <EVsTab pokemon={activePokemon} />

        {/* IVs Tab */}
        <IVsTab pokemon={activePokemon} />
      </Tabs>

      <DialogFooter>
        <Button variant="outline" onClick={() => console.log('implement')}>
          Cancel
        </Button>
        <Button onClick={() => addPokemon()}>Add to Team</Button>
      </DialogFooter>
    </>
  );
}
