'use client';

import type { TypeName } from '@pkmn/dex';
import { Button } from '@pokehub/frontend/shared-ui-components';
import { typeMoveStyles } from '@pokehub/frontend/shared-utils';
import { Dna, Gem, Maximize2, Zap } from 'lucide-react';
import type { BattleMechanic } from '../../types/battle-ui.types';

interface MechanicToggleProps {
  active: boolean;
  onToggle: () => void;
  variant: BattleMechanic;
  teraType?: TypeName;
}

const variantConfig: Record<
  BattleMechanic,
  {
    label: string;
    icon: typeof Dna;
    activeClass: string;
    ringClass: string;
  }
> = {
  mega: {
    label: 'Mega',
    icon: Dna,
    activeClass: 'bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 text-purple-300',
    ringClass: 'ring-purple-400/40',
  },
  zmove: {
    label: 'Z-Move',
    icon: Zap,
    activeClass: 'bg-yellow-500/15 text-yellow-300',
    ringClass: 'ring-yellow-400/30',
  },
  dynamax: {
    label: 'Dynamax',
    icon: Maximize2,
    activeClass: 'bg-red-600/20 text-red-300 scale-[1.02]',
    ringClass: 'ring-red-500/30',
  },
  tera: {
    label: 'Terastallize',
    icon: Gem,
    activeClass: '', // Overridden dynamically with tera type color
    ringClass: '',
  },
};

export function MechanicToggle({
  active,
  onToggle,
  variant,
  teraType,
}: MechanicToggleProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  // For Tera, use the type's color scheme
  let activeClass = config.activeClass;
  let ringClass = config.ringClass;
  if (variant === 'tera' && teraType) {
    const typeStyle = typeMoveStyles[teraType];
    activeClass = `bg-gradient-to-r ${typeStyle.bg} ${typeStyle.text} opacity-80`;
    ringClass = typeStyle.ring.replace('/30', '/50');
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`
        rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200
        ${active
          ? `${activeClass} ring-2 ${ringClass}`
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }
      `}
      onClick={onToggle}
    >
      <Icon className="mr-1.5 h-3.5 w-3.5" />
      {config.label}
      {variant === 'tera' && teraType && (
        <span className="ml-1 text-[10px] opacity-70">{teraType}</span>
      )}
    </Button>
  );
}
