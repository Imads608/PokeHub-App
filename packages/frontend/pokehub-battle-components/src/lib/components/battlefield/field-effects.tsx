'use client';

import type { Field, Side, WeatherName, TerrainName } from '@pkmn/client';
import { Badge } from '@pokehub/frontend/shared-ui-components';
import type { KnownSideCondition } from '../../types/battle-ui.types';

interface FieldEffectsProps {
  field: Field;
  playerSide?: Side;
  opponentSide?: Side;
}

const weatherConfig: Record<WeatherName, { label: string; className: string }> = {
  Sand: { label: 'Sandstorm', className: 'bg-amber-600 text-white' },
  Sun: { label: 'Sun', className: 'bg-orange-400 text-white' },
  Rain: { label: 'Rain', className: 'bg-blue-500 text-white' },
  Hail: { label: 'Hail', className: 'bg-blue-200 text-black' },
  Snow: { label: 'Snow', className: 'bg-blue-100 text-black' },
  'Harsh Sunshine': { label: 'Harsh Sun', className: 'bg-red-500 text-white' },
  'Heavy Rain': { label: 'Heavy Rain', className: 'bg-blue-700 text-white' },
  'Strong Winds': { label: 'Strong Winds', className: 'bg-teal-500 text-white' },
};

const terrainConfig: Record<TerrainName, { label: string; className: string }> = {
  Electric: { label: 'Electric Terrain', className: 'bg-yellow-400 text-black' },
  Grassy: { label: 'Grassy Terrain', className: 'bg-green-500 text-white' },
  Psychic: { label: 'Psychic Terrain', className: 'bg-pink-500 text-white' },
  Misty: { label: 'Misty Terrain', className: 'bg-pink-200 text-black' },
};

/** Styled config for known side conditions (label comes from condition.name) */
const sideConditionStyles: Record<KnownSideCondition, { className: string; showLevel?: boolean }> = {
  // Hazards
  stealthrock: { className: 'bg-stone-600/20 text-stone-400 ring-1 ring-stone-500/20' },
  gmaxsteelsurge: { className: 'bg-slate-500/20 text-slate-400 ring-1 ring-slate-400/20' },
  spikes: { className: 'bg-stone-600/20 text-stone-400 ring-1 ring-stone-500/20', showLevel: true },
  toxicspikes: { className: 'bg-purple-600/20 text-purple-400 ring-1 ring-purple-500/20', showLevel: true },
  stickyweb: { className: 'bg-amber-600/20 text-amber-400 ring-1 ring-amber-500/20' },
  // Screens
  reflect: { className: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20' },
  lightscreen: { className: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/20' },
  auroraveil: { className: 'bg-gradient-to-r from-sky-500/15 to-pink-500/15 text-white ring-1 ring-sky-400/20' },
  // Buffs
  tailwind: { className: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/20' },
  safeguard: { className: 'bg-green-500/15 text-green-300 ring-1 ring-green-400/20' },
  mist: { className: 'bg-blue-300/15 text-blue-200 ring-1 ring-blue-300/20' },
  luckychant: { className: 'bg-pink-400/15 text-pink-300 ring-1 ring-pink-300/20' },
  // Single-turn protections
  craftyshield: { className: 'bg-pink-500/15 text-pink-300 ring-1 ring-pink-400/20' },
  matblock: { className: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20' },
  quickguard: { className: 'bg-yellow-500/15 text-yellow-300 ring-1 ring-yellow-400/20' },
  wideguard: { className: 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/20' },
  // Pledge combos
  firepledge: { className: 'bg-orange-500/15 text-orange-300 ring-1 ring-orange-400/20' },
  grasspledge: { className: 'bg-green-700/15 text-green-400 ring-1 ring-green-500/20' },
  waterpledge: { className: 'bg-gradient-to-r from-red-500/15 via-yellow-500/15 to-blue-500/15 text-white ring-1 ring-yellow-400/20' },
};

const GENERIC_CONDITION_CLASS = 'bg-muted/50 text-muted-foreground ring-1 ring-border/30';

function formatPseudoWeather(id: string): string {
  return id
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function SideConditions({ side, label }: { side: Side; label: string }) {
  const conditions = Object.entries(side.sideConditions);
  if (conditions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 justify-center">
      <span className="text-[9px] text-muted-foreground/50 uppercase tracking-wider self-center mr-1">
        {label}
      </span>
      {conditions.map(([id, condition]) => {
        const known = sideConditionStyles[id as KnownSideCondition];
        const className = known?.className ?? GENERIC_CONDITION_CLASS;

        let displayText = String(condition.name);

        if (known?.showLevel && condition.level > 1) {
          displayText += ` \u00d7${condition.level}`;
        }

        if (condition.minDuration > 0) {
          displayText += ` (${condition.minDuration})`;
        }

        return (
          <Badge key={id} className={`text-[10px] font-medium ${className}`}>
            {displayText}
          </Badge>
        );
      })}
    </div>
  );
}

export function FieldEffects({ field, playerSide, opponentSide }: FieldEffectsProps) {
  const fieldEffects: { label: string; className: string }[] = [];

  if (field.weather) {
    const config = weatherConfig[field.weather];
    const duration = field.weatherState.minDuration;
    const label = duration > 0 ? `${config.label} (${duration})` : config.label;
    fieldEffects.push({ label, className: config.className });
  }

  if (field.terrain) {
    fieldEffects.push(terrainConfig[field.terrain]);
  }

  // Pseudo-weather (Trick Room, Gravity, etc.)
  for (const id of Object.keys(field.pseudoWeather)) {
    fieldEffects.push({
      label: formatPseudoWeather(id),
      className: 'bg-indigo-500 text-white',
    });
  }

  const hasFieldEffects = fieldEffects.length > 0;
  const hasOpponentConditions =
    opponentSide && Object.keys(opponentSide.sideConditions).length > 0;
  const hasPlayerConditions =
    playerSide && Object.keys(playerSide.sideConditions).length > 0;

  if (!hasFieldEffects && !hasOpponentConditions && !hasPlayerConditions)
    return null;

  return (
    <div className="space-y-1.5">
      {opponentSide && hasOpponentConditions && (
        <SideConditions side={opponentSide} label="Foe" />
      )}

      {hasFieldEffects && (
        <div className="flex flex-wrap gap-1 justify-center">
          {fieldEffects.map((effect) => (
            <Badge key={effect.label} className={`text-xs ${effect.className}`}>
              {effect.label}
            </Badge>
          ))}
        </div>
      )}

      {playerSide && hasPlayerConditions && (
        <SideConditions side={playerSide} label="You" />
      )}
    </div>
  );
}
