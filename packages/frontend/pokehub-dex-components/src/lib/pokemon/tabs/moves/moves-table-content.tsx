import type { MoveLearnType } from '../../models/pokemon-moves.model';
import type { Move } from '@pkmn/dex';
import { Badge } from '@pokehub/frontend/shared-ui-components';
import { typeColors } from '@pokehub/frontend/shared-utils';

export interface MovesTableContentProps {
  learnType: MoveLearnType;
  pokemonMoves?: { move: Move; levelLearned?: number }[];
}

// Helper function to get move category color
const getMoveCategoryColor = (category: string) => {
  switch (category) {
    case 'physical':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    case 'special':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'status':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
};

export const MovesTableContent = ({
  learnType,
  pokemonMoves,
}: MovesTableContentProps) => {
  return (
    <table className="w-full">
      <thead className="sticky top-0 bg-background">
        <tr className="border-b text-left">
          <th className="pb-2 text-sm font-medium">Move</th>
          {learnType === 'LevelUp' && (
            <th className="pb-2 text-sm font-medium">Level</th>
          )}
          <th className="pb-2 text-sm font-medium">Type</th>
          <th className="pb-2 text-sm font-medium">Cat.</th>
          <th className="pb-2 text-sm font-medium">Power</th>
          <th className="pb-2 text-sm font-medium">Acc.</th>
          <th className="pb-2 text-sm font-medium">PP</th>
        </tr>
      </thead>
      <tbody>
        {pokemonMoves?.map((moveData, index) => (
          <tr key={index} className="border-b">
            <td className="py-2 text-sm font-medium">{moveData.move.name}</td>
            {learnType === 'LevelUp' && (
              <td className="py-2 text-sm font-medium">
                {moveData.levelLearned || 'By Evolution'}
              </td>
            )}
            <td className="py-2">
              <Badge
                className={`${
                  typeColors[moveData.move.type as keyof typeof typeColors]
                } capitalize hover:bg-current`}
              >
                {moveData.move.type}
              </Badge>
            </td>
            <td className="py-2">
              <span
                className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${getMoveCategoryColor(
                  moveData.move.category
                )}`}
              >
                <img
                  src={`https://play.pokemonshowdown.com/sprites/categories/${moveData.move.category}.png`}
                  alt="Status"
                  height="14"
                  width="32"
                  className="pixelated"
                />
                <span>{moveData.move.category}</span>
              </span>
            </td>
            <td className="py-2 text-sm">{moveData.move.basePower}</td>
            <td className="py-2 text-sm">{moveData.move.accuracy}</td>
            <td className="py-2 text-sm">{moveData.move.pp}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
