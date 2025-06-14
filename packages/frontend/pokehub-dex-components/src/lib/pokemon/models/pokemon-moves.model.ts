export type MoveLearnType = 'TM' | 'LevelUp' | 'EggMove' | 'Event' | 'Tutor';

export const MoveLearnTypeMap: { [key: string]: MoveLearnType } = {
  M: 'TM',
  T: 'Tutor',
  L: 'LevelUp',
  E: 'EggMove',
  V: 'Event',
};

export type MoveLearnTypeAbb = keyof typeof MoveLearnTypeMap;
