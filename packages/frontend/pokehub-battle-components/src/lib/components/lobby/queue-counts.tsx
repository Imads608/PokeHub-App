'use client';

import type { GenerationNum } from '@pkmn/dex';
import { getFormatDisplayName } from '@pokehub/frontend/dex-data-provider';
import { Badge } from '@pokehub/frontend/shared-ui-components';
import { ChevronDown, Users } from 'lucide-react';
import { useState } from 'react';

/** Parse a Showdown format ID like "gen9ou" into generation + format suffix */
function parseFormatId(formatId: string): { gen: GenerationNum; format: string } | null {
  const match = formatId.match(/^gen(\d+)(.+)$/);
  if (!match) return null;
  return { gen: Number(match[1]) as GenerationNum, format: match[2] };
}

interface QueueCountsProps {
  counts: Record<string, number>;
}

export function QueueCounts({ counts }: QueueCountsProps) {
  const [expanded, setExpanded] = useState(false);
  const entries = Object.entries(counts);
  const totalPlayers = entries.reduce((sum, [, count]) => sum + count, 0);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-2">
        No players currently in queue
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">
            {totalPlayers} {totalPlayers === 1 ? 'player' : 'players'} searching
          </span>
          <span className="text-muted-foreground">
            across {entries.length} {entries.length === 1 ? 'format' : 'formats'}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5">
          {entries.map(([formatId, count]) => {
            const parsed = parseFormatId(formatId);
            const displayName = parsed
              ? getFormatDisplayName(parsed.gen, parsed.format)
              : formatId;

            return (
              <div
                key={formatId}
                className="flex items-center justify-between rounded-md border px-3 py-1.5"
              >
                <span className="text-sm">{displayName}</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {count}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
