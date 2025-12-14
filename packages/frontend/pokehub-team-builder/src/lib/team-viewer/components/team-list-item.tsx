'use client';

import { Icons } from '@pkmn/img';
import { Badge, Button } from '@pokehub/frontend/shared-ui-components';
import type { PokemonTeam } from '@pokehub/shared/pokemon-types';
import { formatDistanceToNow } from 'date-fns';
import { Edit, Copy, Trash2 } from 'lucide-react';
import Link from 'next/link';

export interface TeamListItemProps {
  team: PokemonTeam;
  onEdit: (teamId: string) => void;
  onDuplicate: (team: PokemonTeam) => void;
  onDelete: (team: PokemonTeam) => void;
}

export function TeamListItem({
  team,
  onEdit,
  onDuplicate,
  onDelete,
}: TeamListItemProps) {
  const timeAgo = team.updatedAt
    ? formatDistanceToNow(new Date(team.updatedAt), { addSuffix: true })
    : null;

  return (
    <div className="group flex items-center gap-4 rounded-lg border bg-card p-4 transition-all hover:shadow-md">
      {/* Pokemon sprites - horizontal layout */}
      <div className="flex shrink-0 gap-1">
        {team.pokemon.map((pokemon, index) => {
          const icon = Icons.getPokemon(pokemon.species);
          return (
            <div
              key={index}
              className="flex h-8 w-8 items-center justify-center"
            >
              <span style={{ ...icon.css }} />
            </div>
          );
        })}
      </div>

      {/* Team info */}
      <Link
        href={`/team-builder/${team.id}`}
        className="flex min-w-0 flex-1 flex-col"
      >
        <h3 className="truncate font-semibold">{team.name}</h3>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Gen {team.generation}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {team.format}
          </Badge>
          {timeAgo && (
            <span className="text-xs text-muted-foreground">
              Updated {timeAgo}
            </span>
          )}
        </div>
      </Link>

      {/* Action buttons */}
      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(team.id!)}
        >
          <Edit className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onDuplicate(team)}
        >
          <Copy className="h-4 w-4" />
          <span className="sr-only">Duplicate</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(team)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  );
}
