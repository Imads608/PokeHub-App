'use client';

import type { Pokemon } from '@pkmn/client';
import { Badge } from '@pokehub/frontend/shared-ui-components';
import type { KnownVolatile } from '../../types/battle-ui.types';

interface VolatileBadgesProps {
  volatiles: Pokemon['volatiles'];
}

const volatileConfig: Record<
  KnownVolatile,
  { label: string | ((v: Pokemon['volatiles'][string]) => string); className: string }
> = {
  confusion: {
    label: 'CNF',
    className: 'bg-yellow-500/80 text-black',
  },
  substitute: {
    label: 'SUB',
    className: 'bg-sky-500/80 text-white',
  },
  leechseed: {
    label: 'Seed',
    className: 'bg-green-600/80 text-white',
  },
  perishsong: {
    label: (v) => `Perish ${v?.duration ?? '?'}`,
    className: 'bg-red-700/80 text-white',
  },
  encore: {
    label: 'Encore',
    className: 'bg-pink-500/80 text-white',
  },
  taunt: {
    label: 'Taunt',
    className: 'bg-red-500/80 text-white',
  },
  curse: {
    label: 'Curse',
    className: 'bg-purple-800/80 text-white',
  },
  yawn: {
    label: 'Drowsy',
    className: 'bg-gray-400/80 text-black',
  },
  flashfire: {
    label: 'FlashFire',
    className: 'bg-orange-500/80 text-white',
  },
};

export function VolatileBadges({ volatiles }: VolatileBadgesProps) {
  const active = Object.keys(volatiles).filter(
    (id): id is KnownVolatile => id in volatileConfig
  );
  if (active.length === 0) return null;

  return (
    <>
      {active.map((id) => {
        const config = volatileConfig[id];
        const label =
          typeof config.label === 'function'
            ? config.label(volatiles[id])
            : config.label;

        return (
          <Badge
            key={id}
            className={`text-[10px] font-bold px-1 py-0 leading-tight ${config.className}`}
          >
            {label}
          </Badge>
        );
      })}
    </>
  );
}
