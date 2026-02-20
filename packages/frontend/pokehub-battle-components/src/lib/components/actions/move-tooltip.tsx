'use client';

import type { Battle, Pokemon } from '@pkmn/client';
import type { Move } from '@pkmn/dex-types';
import type { TypeName } from '@pkmn/dex';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@pokehub/frontend/shared-ui-components';
import { getTypeEffectiveness } from '@pokehub/frontend/shared-utils';
import {
  PhysicalIcon,
  SpecialIcon,
  StatusIcon,
} from '@pokehub/frontend/shared-ui-icons';
import { ChevronUp, ChevronDown, X } from 'lucide-react';

interface MoveTooltipProps {
  children: React.ReactNode;
  dexMove: Move | null | undefined;
  battle: Battle;
  opponentPokemon: Pokemon | null;
}

const categoryIcons = {
  Physical: PhysicalIcon,
  Special: SpecialIcon,
  Status: StatusIcon,
} as const;

/** Flags worth surfacing as pills */
const displayFlags: Record<string, string> = {
  contact: 'Contact',
  sound: 'Sound',
  punch: 'Punch',
  bite: 'Bite',
  bullet: 'Bullet',
  heal: 'Heal',
  recharge: 'Recharge',
  charge: 'Charge',
};

function EffectivenessBadge({ multiplier }: { multiplier: number }) {
  if (multiplier === 1) return null;

  if (multiplier === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-md bg-gray-900 px-1.5 py-0.5 text-[10px] font-bold text-gray-400 ring-1 ring-gray-700">
        <X className="h-2.5 w-2.5" />
        0×
      </span>
    );
  }

  const isSuper = multiplier > 1;
  const label =
    multiplier >= 4
      ? '4×'
      : multiplier === 2
        ? '2×'
        : multiplier === 0.5
          ? '½×'
          : '¼×';

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1 ${
        isSuper
          ? 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/25'
          : 'bg-red-500/15 text-red-400 ring-red-500/25'
      }`}
    >
      {isSuper ? (
        <ChevronUp className="h-2.5 w-2.5" />
      ) : (
        <ChevronDown className="h-2.5 w-2.5" />
      )}
      {label}
    </span>
  );
}

export function MoveTooltip({
  children,
  dexMove,
  battle,
  opponentPokemon,
}: MoveTooltipProps) {
  if (!dexMove) return <>{children}</>;

  const CategoryIcon = categoryIcons[dexMove.category];

  const effectiveness =
    dexMove.category !== 'Status' && opponentPokemon?.types?.length
      ? getTypeEffectiveness(
          battle.gen,
          dexMove.type as TypeName,
          opponentPokemon.types as readonly TypeName[]
        )
      : null;

  const flags = Object.entries(dexMove.flags ?? {})
    .filter(([key]) => key in displayFlags)
    .map(([key]) => displayFlags[key]);

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <div>{children}</div>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-popover/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-xl p-3 max-w-[280px]"
      >
        {/* Move name + effectiveness */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-sm">{dexMove.name}</span>
          {effectiveness != null && (
            <EffectivenessBadge multiplier={effectiveness} />
          )}
        </div>

        {/* Description */}
        {dexMove.shortDesc && (
          <p className="mt-1.5 text-xs text-muted-foreground italic leading-relaxed">
            {dexMove.shortDesc}
          </p>
        )}

        {/* Flag pills + Priority */}
        {(flags.length > 0 || dexMove.priority !== 0) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {flags.map((flag) => (
              <span
                key={flag}
                className="text-[10px] bg-muted/50 text-muted-foreground rounded-full px-1.5 py-0.5"
              >
                {flag}
              </span>
            ))}
            {dexMove.priority !== 0 && (
              <span
                className={`text-[10px] rounded-full px-1.5 py-0.5 font-semibold ${
                  dexMove.priority > 0
                    ? 'bg-blue-500/15 text-blue-400'
                    : 'bg-red-500/15 text-red-400'
                }`}
              >
                {dexMove.priority > 0 ? '+' : ''}
                {dexMove.priority} Priority
              </span>
            )}
          </div>
        )}

        {/* Bottom summary line */}
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <CategoryIcon className="h-3 w-3 opacity-60" />
          <span>{dexMove.category}</span>
          <span className="opacity-40">·</span>
          <span>{dexMove.type}</span>
          {dexMove.basePower > 0 && (
            <>
              <span className="opacity-40">·</span>
              <span>{dexMove.basePower} BP</span>
            </>
          )}
          {dexMove.accuracy !== true && (
            <>
              <span className="opacity-40">·</span>
              <span>{dexMove.accuracy}%</span>
            </>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
