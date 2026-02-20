'use client';

import type { TypeName } from '@pkmn/dex';
import { Button } from '@pokehub/frontend/shared-ui-components';
import { typeMoveStyles } from '@pokehub/frontend/shared-utils';
import { Swords, Sparkles, CircleDot } from 'lucide-react';

const categoryIcons = {
  Physical: Swords,
  Special: Sparkles,
  Status: CircleDot,
} as const;

interface MoveButtonProps {
  name: string;
  type?: TypeName;
  pp?: number;
  maxpp?: number;
  power?: number | null;
  accuracy?: number | true | null;
  category?: 'Physical' | 'Special' | 'Status';
  disabled?: boolean;
  onSelect: () => void;
}

export function MoveButton({
  name,
  type,
  pp,
  maxpp,
  power,
  accuracy,
  category,
  disabled = false,
  onSelect,
}: MoveButtonProps) {
  const style = type ? typeMoveStyles[type] : null;
  const ppRatio = pp !== undefined && maxpp ? pp / maxpp : 1;
  const ppColorClass =
    ppRatio <= 0.25 ? 'text-red-300' : ppRatio <= 0.5 ? 'text-amber-300' : '';
  const noPP = pp === 0;

  const CategoryIcon = category ? categoryIcons[category] : null;

  return (
    <Button
      variant="outline"
      className={`
        relative overflow-hidden h-auto rounded-xl px-3.5 py-2.5 w-full text-left justify-start flex-col items-start
        ring-1 ring-inset border-0
        shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]
        ${style
          ? `bg-gradient-to-br ${style.bg} ${style.text} ${style.ring} hover:brightness-110`
          : 'bg-muted text-foreground ring-border'
        }
        ${disabled
          ? 'opacity-40 grayscale-[30%]'
          : 'hover:shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-all duration-150'
        }
      `}
      disabled={disabled}
      onClick={onSelect}
    >
      {/* Top row: Category icon + Name */}
      <div className="flex items-center gap-1.5 w-full">
        {CategoryIcon && (
          <CategoryIcon className="h-3.5 w-3.5 shrink-0 opacity-60" />
        )}
        <span className="block font-bold text-sm leading-tight truncate">
          {name}
        </span>
      </div>

      {/* Stats row: Power · Accuracy · PP */}
      <div
        className={`flex items-center gap-1.5 mt-1.5 font-mono tabular-nums text-[11px] w-full ${
          disabled ? 'opacity-50' : 'opacity-70'
        }`}
      >
        {/* Power — skip for Status moves */}
        {power != null && power > 0 && (
          <>
            <span>{power} BP</span>
            <span className="opacity-40">·</span>
          </>
        )}

        {/* Accuracy */}
        {accuracy != null && (
          <>
            <span>{accuracy === true ? '—' : `${accuracy}%`}</span>
            <span className="opacity-40">·</span>
          </>
        )}

        {/* PP */}
        {pp !== undefined && maxpp !== undefined && (
          <span className={`${ppColorClass} ${noPP ? 'font-semibold' : ''}`}>
            {pp}/{maxpp} PP
          </span>
        )}
      </div>

      {/* Type watermark — top right */}
      {type && (
        <span className="absolute top-1.5 right-2 text-[9px] font-bold uppercase tracking-wider opacity-30">
          {type}
        </span>
      )}
    </Button>
  );
}
