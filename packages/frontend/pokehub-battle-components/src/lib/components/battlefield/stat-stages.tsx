'use client';

import type { BoostID, BoostsTable } from '@pkmn/types';

const statLabels: Record<BoostID, string> = {
  atk: 'Atk',
  def: 'Def',
  spa: 'SpA',
  spd: 'SpD',
  spe: 'Spe',
  accuracy: 'Acc',
  evasion: 'Eva',
};

interface StatStagesProps {
  boosts: Partial<BoostsTable>;
}

export function StatStages({ boosts }: StatStagesProps) {
  const entries = (Object.entries(boosts) as [BoostID, number][]).filter(
    ([, value]) => value !== 0
  );
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([stat, value]) => {
        const isPositive = value > 0;
        const isMax = Math.abs(value) === 6;

        return (
          <span
            key={stat}
            className={`
              text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ring-1
              ${isPositive
                ? `bg-emerald-500/15 text-emerald-400 ${isMax ? 'ring-emerald-400/40' : 'ring-emerald-500/20'}`
                : `bg-red-500/15 text-red-400 ${isMax ? 'ring-red-400/40' : 'ring-red-500/20'}`
              }
            `}
          >
            {isPositive ? '↑' : '↓'}
            {statLabels[stat]}
            {isPositive ? '+' : ''}
            {value}
          </span>
        );
      })}
    </div>
  );
}
