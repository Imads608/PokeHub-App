import type { TypeName } from '@pkmn/dex';

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
