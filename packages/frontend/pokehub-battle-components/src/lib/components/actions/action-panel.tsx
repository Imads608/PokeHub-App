'use client';

import type { Battle } from '@pkmn/client';
import { Icons } from '@pkmn/img';
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@pokehub/frontend/shared-ui-components';
import { Loader2, Undo2, Zap, ArrowLeftRight } from 'lucide-react';
import { MovePanel } from './move-panel';
import { SwitchPanel } from './switch-panel';

interface ActionPanelProps {
  battle: Battle;
  pendingChoice: string | null;
  onMoveSelect: (choice: string) => void;
  onSwitchSelect: (choice: string) => void;
  onTeamSelect: (choice: string) => void;
  onCancelChoice: () => void;
}

/**
 * Formats a raw choice string (e.g. "move 1", "switch 3", "team 1, 2, 3")
 * into a human-readable label for display while waiting.
 */
function formatChoiceLabel(choice: string, battle: Battle): string {
  const request = battle.request;

  if (choice.startsWith('move ')) {
    const moveIndex = parseInt(choice.split(' ')[1], 10) - 1;
    if (request?.requestType === 'move' && request.active?.[0]) {
      const move = request.active[0].moves[moveIndex];
      if (move) return move.name;
    }
    return `Move ${moveIndex + 1}`;
  }

  if (choice.startsWith('switch ')) {
    const slotIndex = parseInt(choice.split(' ')[1], 10) - 1;
    if (request?.side?.pokemon[slotIndex]) {
      const species = request.side.pokemon[slotIndex].details.split(',')[0];
      return `Switch to ${species}`;
    }
    return `Switch ${slotIndex + 1}`;
  }

  if (choice.startsWith('team ')) {
    return 'Team order selected';
  }

  return choice;
}

export function ActionPanel({
  battle,
  pendingChoice,
  onMoveSelect,
  onSwitchSelect,
  onTeamSelect,
  onCancelChoice,
}: ActionPanelProps) {
  const request = battle.request;

  // Waiting for server (no request) or explicit wait request
  if (!request || request.requestType === 'wait') {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm py-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">Waiting for opponent...</span>
      </div>
    );
  }

  // Player has submitted a choice — show waiting state with option to change
  if (pendingChoice) {
    const label = formatChoiceLabel(pendingChoice, battle);

    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm py-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Waiting for opponent...</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Your choice: <span className="font-semibold text-foreground">{label}</span>
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={onCancelChoice}
        >
          <Undo2 className="mr-1.5 h-3.5 w-3.5" />
          Change Move
        </Button>
      </div>
    );
  }

  // Team preview — choose lead order
  if (request.requestType === 'team') {
    const pokemon = request.side.pokemon;

    return (
      <div className="space-y-3 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-4">
        <p className="text-sm font-semibold text-center">
          Choose your lead Pokemon
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {pokemon.map((poke, index) => {
            const species = poke.details.split(',')[0];
            const icon = Icons.getPokemon(species);

            return (
              <Button
                key={poke.ident}
                variant="outline"
                className="h-auto py-2.5 px-3 justify-start gap-3 hover:border-primary/30 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
                onClick={() => {
                  // Build team order string: chosen lead first, rest in original order
                  const order = [index + 1];
                  for (let i = 1; i <= pokemon.length; i++) {
                    if (i !== index + 1) order.push(i);
                  }
                  onTeamSelect(`team ${order.join(', ')}`);
                }}
              >
                <span style={{ ...icon.css }} className="shrink-0" />
                <span className="font-semibold text-sm">{species}</span>
              </Button>
            );
          })}
        </div>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            // Default order: 1, 2, 3, ...
            const order = pokemon.map((_, i) => i + 1).join(', ');
            onTeamSelect(`team ${order}`);
          }}
        >
          Confirm Default Order
        </Button>
      </div>
    );
  }

  // Force switch — only show switch panel (e.g., after a faint)
  if (request.requestType === 'switch') {
    return (
      <div className="space-y-3 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-4">
        <p className="text-sm font-semibold text-center">
          Choose a Pokemon to switch in
        </p>
        <SwitchPanel
          battle={battle}
          onSwitchSelect={onSwitchSelect}
        />
      </div>
    );
  }

  // Normal move request — show moves and switch tabs
  if (request.requestType === 'move') {
    const trapped = request.active?.[0]?.trapped || request.active?.[0]?.maybeTrapped;

    return (
      <div className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-4">
        <Tabs defaultValue="moves">
          <TabsList className="w-full mb-3 bg-muted/50">
            <TabsTrigger value="moves" className="flex-1 gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Moves
            </TabsTrigger>
            <TabsTrigger value="switch" className="flex-1 gap-1.5" disabled={trapped}>
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Switch {trapped ? '(Trapped)' : ''}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="moves" className="mt-0">
            <MovePanel
              battle={battle}
              onMoveSelect={onMoveSelect}
            />
          </TabsContent>
          <TabsContent value="switch" className="mt-0">
            <SwitchPanel
              battle={battle}
              onSwitchSelect={onSwitchSelect}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return null;
}
