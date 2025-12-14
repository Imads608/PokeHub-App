'use client';

import { Icons } from '@pkmn/img';
import { getFormatDisplayName } from '@pokehub/frontend/dex-data-provider';
import {
  Card,
  CardContent,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@pokehub/frontend/shared-ui-components';
import type { PokemonTeam } from '@pokehub/shared/pokemon-types';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Edit, Copy, Trash2 } from 'lucide-react';
import Link from 'next/link';

export interface TeamCardProps {
  team: PokemonTeam;
  onEdit: (teamId: string) => void;
  onDuplicate: (team: PokemonTeam) => void;
  onDelete: (team: PokemonTeam) => void;
}

export function TeamCard({
  team,
  onEdit,
  onDuplicate,
  onDelete,
}: TeamCardProps) {
  const timeAgo = team.updatedAt
    ? formatDistanceToNow(new Date(team.updatedAt), { addSuffix: true })
    : null;

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md">
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(team.id!)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(team)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(team)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Link href={`/team-builder/${team.id}`}>
        <div className="bg-muted/50 p-4">
          <div className="mb-2 flex gap-2">
            <Badge variant="outline" className="text-xs">
              {getFormatDisplayName(team.generation, team.format)}
            </Badge>
          </div>

          {/* Pokemon sprites grid */}
          <div className="flex flex-wrap gap-1 py-2">
            {team.pokemon.map((pokemon, index) => {
              const icon = Icons.getPokemon(pokemon.species);
              return (
                <div
                  key={index}
                  className="flex h-10 items-center justify-center"
                >
                  <span style={{ ...icon.css }} />
                </div>
              );
            })}
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="truncate font-semibold">{team.name}</h3>
          {timeAgo && (
            <p className="mt-1 text-xs text-muted-foreground">
              Updated {timeAgo}
            </p>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}
