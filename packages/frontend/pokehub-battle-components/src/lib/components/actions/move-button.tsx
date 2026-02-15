'use client';

import type { TypeName } from '@pkmn/dex';
import { Button } from '@pokehub/frontend/shared-ui-components';
import { typeColors } from '@pokehub/frontend/shared-utils';

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
  const typeClass = type ? typeColors[type] : '';

  return (
    <Button
      variant="outline"
      className={`h-auto flex-col gap-0.5 py-2 px-3 w-full ${typeClass} ${
        disabled ? 'opacity-50' : ''
      }`}
      disabled={disabled}
      onClick={onSelect}
    >
      <span className="font-semibold text-sm">{name}</span>
      {pp !== undefined && maxpp !== undefined && (
        <span className="text-xs opacity-80">
          {pp}/{maxpp} PP
        </span>
      )}
    </Button>
  );
}
