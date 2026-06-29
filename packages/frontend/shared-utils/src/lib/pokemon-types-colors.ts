import type { TypeName } from '@pkmn/dex';

/**
 * Simple type → Tailwind class mapping for basic badges and indicators.
 */
export const typeColors: { [key in TypeName]: string } = {
  Normal: 'bg-gray-400 text-white',
  Fire: 'bg-orange-500 text-white',
  Water: 'bg-blue-500 text-white',
  Electric: 'bg-yellow-400 text-black',
  Grass: 'bg-green-500 text-white',
  Ice: 'bg-blue-200 text-black',
  Fighting: 'bg-red-700 text-white',
  Poison: 'bg-purple-500 text-white',
  Ground: 'bg-amber-600 text-white',
  Flying: 'bg-indigo-300 text-black',
  Psychic: 'bg-pink-500 text-white',
  Bug: 'bg-lime-500 text-white',
  Rock: 'bg-yellow-700 text-white',
  Ghost: 'bg-purple-700 text-white',
  Dragon: 'bg-indigo-600 text-white',
  Dark: 'bg-gray-700 text-white',
  Steel: 'bg-gray-500 text-white',
  Fairy: 'bg-pink-300 text-black',
  '???': '',
  Stellar: '',
};

/**
 * Type → gradient and styling for move buttons.
 * Each entry provides a gradient background, text color, and subtle border/ring.
 */
export const typeMoveStyles: { [key in TypeName]: { bg: string; text: string; ring: string } } = {
  Normal:   { bg: 'from-stone-400 to-stone-500', text: 'text-white', ring: 'ring-stone-400/30' },
  Fire:     { bg: 'from-orange-500 to-red-600', text: 'text-white', ring: 'ring-orange-400/30' },
  Water:    { bg: 'from-blue-400 to-blue-600', text: 'text-white', ring: 'ring-blue-400/30' },
  Electric: { bg: 'from-yellow-300 to-amber-400', text: 'text-gray-900', ring: 'ring-yellow-400/30' },
  Grass:    { bg: 'from-green-400 to-emerald-600', text: 'text-white', ring: 'ring-green-400/30' },
  Ice:      { bg: 'from-cyan-200 to-blue-300', text: 'text-gray-900', ring: 'ring-cyan-300/30' },
  Fighting: { bg: 'from-red-600 to-red-800', text: 'text-white', ring: 'ring-red-500/30' },
  Poison:   { bg: 'from-purple-500 to-purple-700', text: 'text-white', ring: 'ring-purple-400/30' },
  Ground:   { bg: 'from-amber-500 to-yellow-700', text: 'text-white', ring: 'ring-amber-400/30' },
  Flying:   { bg: 'from-indigo-300 to-sky-400', text: 'text-gray-900', ring: 'ring-indigo-300/30' },
  Psychic:  { bg: 'from-pink-400 to-pink-600', text: 'text-white', ring: 'ring-pink-400/30' },
  Bug:      { bg: 'from-lime-400 to-green-600', text: 'text-white', ring: 'ring-lime-400/30' },
  Rock:     { bg: 'from-yellow-600 to-stone-600', text: 'text-white', ring: 'ring-yellow-500/30' },
  Ghost:    { bg: 'from-purple-600 to-indigo-800', text: 'text-white', ring: 'ring-purple-500/30' },
  Dragon:   { bg: 'from-indigo-500 to-violet-700', text: 'text-white', ring: 'ring-indigo-400/30' },
  Dark:     { bg: 'from-gray-600 to-gray-800', text: 'text-white', ring: 'ring-gray-500/30' },
  Steel:    { bg: 'from-slate-400 to-slate-500', text: 'text-white', ring: 'ring-slate-400/30' },
  Fairy:    { bg: 'from-pink-300 to-rose-400', text: 'text-gray-900', ring: 'ring-pink-300/30' },
  '???':    { bg: 'from-gray-400 to-gray-500', text: 'text-white', ring: 'ring-gray-400/30' },
  Stellar:  { bg: 'from-violet-400 to-cyan-400', text: 'text-white', ring: 'ring-violet-400/30' },
};
