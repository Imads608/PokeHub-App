'use client';

import type { TypeName } from '@pkmn/dex';
import { Button } from '@pokehub/frontend/shared-ui-components';
import { typeMoveStyles } from '@pokehub/frontend/shared-utils';

interface MoveButtonProps {
  name: string;
  type?: TypeName;
  pp?: number;
  maxpp?: number;
  disabled?: boolean;
  onSelect: () => void;
}

export function MoveButton({
  name,
  type,
  pp,
  maxpp,
  disabled = false,
  onSelect,
}: MoveButtonProps) {
  const style = type ? typeMoveStyles[type] : null;
  const ppLow = pp !== undefined && maxpp !== undefined && pp <= Math.floor(maxpp / 4);

  return (
    <Button
      variant="outline"
      className={`
        relative overflow-hidden h-auto rounded-xl px-4 py-3 w-full text-left justify-start flex-col items-start
        ring-1 ring-inset border-0
        ${style
          ? `bg-gradient-to-br ${style.bg} ${style.text} ${style.ring} hover:brightness-110`
          : 'bg-muted text-foreground ring-border'
        }
        ${disabled ? 'opacity-40 grayscale-[30%]' : 'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'}
      `}
      disabled={disabled}
      onClick={onSelect}
    >
      {/* Subtle highlight across top */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/20" />

      <span className="block font-bold text-sm leading-tight">{name}</span>
      {pp !== undefined && maxpp !== undefined && (
        <span className={`block text-[11px] mt-0.5 ${ppLow ? 'font-semibold opacity-90' : 'opacity-60'}`}>
          {pp}/{maxpp} PP
        </span>
      )}

      {/* Type label */}
      {type && (
        <span className="absolute top-1.5 right-2 text-[9px] font-bold uppercase tracking-wider opacity-40">
          {type}
        </span>
      )}
    </Button>
  );
}
