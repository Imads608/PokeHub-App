import type { GenerationNum } from '@pkmn/dex';

export interface GenerationDetails {
  id: GenerationNum;
  name: string;
  games: string;
  years: string;
}

const generationsData: GenerationDetails[] = [
  {
    id: 1,
    name: 'Generation I',
    games: 'Red/Blue/Yellow',
    years: '1996-1999',
  },
  {
    id: 2,
    name: 'Generation II',
    games: 'Gold/Silver/Crystal',
    years: '1999-2002',
  },
  {
    id: 3,
    name: 'Generation III',
    games: 'Ruby/Sapphire/Emerald/FireRed/LeafGreen',
    years: '2002-2006',
  },
  {
    id: 4,
    name: 'Generation IV',
    games: 'Diamond/Pearl/Platinum/HeartGold/SoulSilver',
    years: '2006-2010',
  },
  {
    id: 5,
    name: 'Generation V',
    games: 'Black/White/Black 2/White 2',
    years: '2010-2013',
  },
  {
    id: 6,
    name: 'Generation VI',
    games: 'X/Y/Omega Ruby/Alpha Sapphire',
    years: '2013-2016',
  },
  {
    id: 7,
    name: 'Generation VII',
    games: "Sun/Moon/Ultra Sun/Ultra Moon/Let's Go",
    years: '2016-2019',
  },
  {
    id: 8,
    name: 'Generation VIII',
    games: 'Sword/Shield/Brilliant Diamond/Shining Pearl/Legends',
    years: '2019-2022',
  },
  {
    id: 9,
    name: 'Generation IX',
    games: 'Scarlet/Violet',
    years: '2022-Present',
  },
];

export const getGenerationsData = () => generationsData;
