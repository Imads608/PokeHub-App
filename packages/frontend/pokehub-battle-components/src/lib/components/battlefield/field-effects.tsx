'use client';

import type { Field, WeatherName, TerrainName } from '@pkmn/client';
import { Badge } from '@pokehub/frontend/shared-ui-components';

interface FieldEffectsProps {
  field: Field;
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

export function FieldEffects({ field }: FieldEffectsProps) {
  const effects: { label: string; className: string }[] = [];

  if (field.weather) {
    effects.push(weatherConfig[field.weather]);
  }

  if (field.terrain) {
    effects.push(terrainConfig[field.terrain]);
  }

  // Pseudo-weather (Trick Room, Gravity, etc.)
  for (const id of Object.keys(field.pseudoWeather)) {
    effects.push({
      label: id.replace(/([A-Z])/g, ' $1').trim(),
      className: 'bg-indigo-500 text-white',
    });
  }

  if (effects.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 justify-center">
      {effects.map((effect) => (
        <Badge key={effect.label} className={`text-xs ${effect.className}`}>
          {effect.label}
        </Badge>
      ))}
    </div>
  );
}
