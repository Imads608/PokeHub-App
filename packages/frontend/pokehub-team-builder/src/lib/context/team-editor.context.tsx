'use client';

import type { TeamEditorContextModel } from './team-editor.context.model';
import { createContext, useContext } from 'react';

export const TeamEditorContext = createContext<
  TeamEditorContextModel<'ReadWrite'>
>({
  teamName: {
    value: undefined,
    setValue: () => {
      // Function needs to be set
    },
  },
  format: {
    value: 'Singles',
    setValue: () => {
      // Function needs to be set
    },
  },
  tier: {
    value: 'AG',
    setValue: () => {
      // Function needs to be set
    },
  },
  generation: {
    value: 9,
    setValue: () => {
      // Function needs to be set
    },
  },
  teamPokemon: {
    value: [undefined, undefined, undefined, undefined, undefined, undefined],
    setValue: () => {
      // Function needs to be set
    },
  },
});

export const useTeamEditorContext = () => {
  return useContext(TeamEditorContext);
};
