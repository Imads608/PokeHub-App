'use client';

import type { WeatherName, TerrainName } from '@pkmn/client';

interface BattlefieldBgProps {
  weather?: WeatherName | null;
  terrain?: TerrainName | null;
}

/** Weather → semi-transparent tint overlay */
const weatherOverlay: Record<WeatherName, string> = {
  Sun: 'bg-orange-400/15',
  Rain: 'bg-blue-500/20',
  Sand: 'bg-amber-700/20',
  Hail: 'bg-blue-200/20',
  Snow: 'bg-blue-100/25',
  'Harsh Sunshine': 'bg-red-500/20',
  'Heavy Rain': 'bg-blue-800/25',
  'Strong Winds': 'bg-teal-500/15',
};

/** Terrain → bottom-half gradient glow */
const terrainOverlay: Record<TerrainName, string> = {
  Electric: 'from-transparent via-transparent to-yellow-400/20',
  Grassy: 'from-transparent via-transparent to-green-500/20',
  Psychic: 'from-transparent via-transparent to-pink-500/20',
  Misty: 'from-transparent via-transparent to-pink-200/25',
};

/**
 * Battlefield background — renders behind Pokemon sprites.
 *
 * Expects a background image at /images/backgrounds/default-field.webp.
 * Falls back to a dark surface if the image is missing.
 *
 * Layers (bottom to top):
 * 1. Base arena image (or dark fallback)
 * 2. Weather tint overlay
 * 3. Terrain glow overlay
 * 4. Subtle vignette for depth
 */
export function BattlefieldBg({ weather, terrain }: BattlefieldBgProps) {
  const weatherClass = weather ? weatherOverlay[weather] : null;
  const terrainClass = terrain ? terrainOverlay[terrain] : null;

  return (
    <>
      {/* Layer 1: Base arena image */}
      <div
        className="absolute inset-0 bg-muted/30 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/backgrounds/default-field.png)',
        }}
      />

      {/* Layer 2: Weather tint */}
      {weatherClass && (
        <div
          className={`absolute inset-0 ${weatherClass} transition-colors duration-1000`}
        />
      )}

      {/* Layer 3: Terrain glow (bottom-half) */}
      {terrainClass && (
        <div
          className={`absolute inset-0 bg-gradient-to-b ${terrainClass} transition-colors duration-1000`}
        />
      )}

      {/* Vignette — darkens edges for depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)',
        }}
      />
    </>
  );
}
