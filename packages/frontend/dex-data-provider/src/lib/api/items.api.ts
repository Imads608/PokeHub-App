import { getModdedDex } from '../../utils';
import type { GenerationNum, Item, ItemName } from '@pkmn/dex';

export function getItemDetails(itemName: ItemName, generation?: GenerationNum) {
  const moddedDex = getModdedDex(generation);
  const itemDetails = moddedDex.items.get(itemName);

  if (!itemDetails.exists) {
    return undefined;
  }
  return itemDetails;
}

export function getItems(generation?: GenerationNum): Item[] {
  const moddedDex = getModdedDex(generation);
  const items = moddedDex.items.all();
  return items as Item[];
}
