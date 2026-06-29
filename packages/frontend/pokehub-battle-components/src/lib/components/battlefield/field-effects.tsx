'use client';

import type { Field, Side, WeatherName, TerrainName } from '@pkmn/client';
import { Badge } from '@pokehub/frontend/shared-ui-components';
import type { KnownSideCondition } from '../../types/battle-ui.types';

// ── Weather & Terrain configs ──────────────────────────────────────────

const weatherConfig: Record<WeatherName, { label: string; className: string }> = {
  Sun: { label: 'Sun', className: 'bg-orange-400 text-black' },
  Rain: { label: 'Rain', className: 'bg-blue-500 text-white' },
  Sand: { label: 'Sandstorm', className: 'bg-amber-600 text-white' },
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

// ── Side condition config ──────────────────────────────────────────────

const sideConditionStyles: Record<KnownSideCondition, { className: string; showLevel?: boolean }> = {
  stealthrock: { className: 'bg-stone-600 text-white' },
  gmaxsteelsurge: { className: 'bg-slate-600 text-white' },
  spikes: { className: 'bg-stone-600 text-white', showLevel: true },
  toxicspikes: { className: 'bg-purple-600 text-white', showLevel: true },
  stickyweb: { className: 'bg-amber-700 text-white' },
  reflect: { className: 'bg-amber-500 text-black' },
  lightscreen: { className: 'bg-sky-500 text-white' },
  auroraveil: { className: 'bg-gradient-to-r from-sky-500 to-pink-500 text-white' },
  tailwind: { className: 'bg-cyan-600 text-white' },
  safeguard: { className: 'bg-green-600 text-white' },
  mist: { className: 'bg-blue-400 text-black' },
  luckychant: { className: 'bg-pink-500 text-white' },
  craftyshield: { className: 'bg-pink-600 text-white' },
  matblock: { className: 'bg-amber-600 text-white' },
  quickguard: { className: 'bg-yellow-500 text-black' },
  wideguard: { className: 'bg-blue-600 text-white' },
  firepledge: { className: 'bg-orange-600 text-white' },
  grasspledge: { className: 'bg-green-700 text-white' },
  waterpledge: { className: 'bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 text-white' },
};

const GENERIC_CONDITION_CLASS = 'bg-muted text-foreground';

function formatPseudoWeather(id: string): string {
  return id
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

// ── Weather Bar — pinned to top of arena ───────────────────────────────

interface WeatherBarProps {
  field: Field;
}

/**
 * Slim status bar at the top edge of the arena showing
 * weather, terrain, and pseudo-weather (Trick Room, Gravity, etc.)
 */
export function WeatherBar({ field }: WeatherBarProps) {
  const effects: { label: string; className: string }[] = [];

  if (field.weather) {
    const config = weatherConfig[field.weather];
    const duration = field.weatherState.minDuration;
    const label = duration > 0 ? `${config.label} (${duration})` : config.label;
    effects.push({ label, className: config.className });
  }

  if (field.terrain) {
    effects.push(terrainConfig[field.terrain]);
  }

  for (const id of Object.keys(field.pseudoWeather)) {
    effects.push({
      label: formatPseudoWeather(id),
      className: 'bg-indigo-500 text-white',
    });
  }

  if (effects.length === 0) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-20 flex justify-center gap-1.5 p-2">
      {effects.map((effect) => (
        <span
          key={effect.label}
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-md ${effect.className}`}
        >
          {effect.label}
        </span>
      ))}
    </div>
  );
}

// ── Side Conditions — tucked next to each nameplate ────────────────────

interface SideConditionsProps {
  side: Side;
  align?: 'left' | 'right';
}

/**
 * Compact badges for a player's side conditions, meant to be
 * placed alongside (or below) the nameplate, not in the arena center.
 */
export function SideConditions({ side, align = 'left' }: SideConditionsProps) {
  const conditions = Object.entries(side.sideConditions);
  if (conditions.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap gap-1 ${
        align === 'right' ? 'justify-end' : 'justify-start'
      }`}
    >
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

