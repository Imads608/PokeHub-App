import { extractAnimationEvent } from './animation-events';

/** Minimal mock Battle with active Pokemon for HP reads */
function mockBattle(
  p1 = { name: 'Charizard', hp: 100, maxhp: 100, fainted: false },
  p2 = { name: 'Blastoise', hp: 100, maxhp: 100, fainted: false }
) {
  return {
    p1: { active: [p1] },
    p2: { active: [p2] },
  };
}

describe('extractAnimationEvent', () => {
  const battle = mockBattle();

  // ── move ───────────────────────────────────────────────────────────

  it('move → { type: move, attacker, defender, moveName }', () => {
    const args = ['move', 'p1a: Charizard', 'Flamethrower', 'p2a: Blastoise'];
    expect(extractAnimationEvent(args, battle)).toEqual({
      type: 'move',
      attacker: 'p1a: Charizard',
      defender: 'p2a: Blastoise',
      moveName: 'Flamethrower',
    });
  });

  it('move with no explicit defender → defaults to attacker', () => {
    const args = ['move', 'p1a: Charizard', 'Swords Dance', ''];
    expect(extractAnimationEvent(args, battle)).toEqual({
      type: 'move',
      attacker: 'p1a: Charizard',
      defender: 'p1a: Charizard',
      moveName: 'Swords Dance',
    });
  });

  // ── -damage ────────────────────────────────────────────────────────

  it('-damage → reads prevHp from battle, parses newHp from args', () => {
    const b = mockBattle(
      undefined,
      { name: 'Blastoise', hp: 80, maxhp: 100, fainted: false }
    );
    const args = ['-damage', 'p2a: Blastoise', '50/100'];
    expect(extractAnimationEvent(args, b)).toEqual({
      type: 'damage',
      pokemon: 'p2a: Blastoise',
      prevHp: 80,
      newHp: 50,
      maxHp: 100,
    });
  });

  it('-damage with 0 HP (fainted) → newHp=0', () => {
    const args = ['-damage', 'p2a: Blastoise', '0 fnt'];
    expect(extractAnimationEvent(args, battle)).toEqual({
      type: 'damage',
      pokemon: 'p2a: Blastoise',
      prevHp: 100,
      newHp: 0,
      maxHp: 100,
    });
  });

  it('-damage with status suffix → strips status before parsing', () => {
    const args = ['-damage', 'p1a: Charizard', '75/100 brn'];
    expect(extractAnimationEvent(args, battle)).toEqual({
      type: 'damage',
      pokemon: 'p1a: Charizard',
      prevHp: 100,
      newHp: 75,
      maxHp: 100,
    });
  });

  // ── -heal ──────────────────────────────────────────────────────────

  it('-heal → { type: heal, prevHp, newHp, maxHp }', () => {
    const b = mockBattle(
      { name: 'Charizard', hp: 50, maxhp: 100, fainted: false }
    );
    const args = ['-heal', 'p1a: Charizard', '75/100'];
    expect(extractAnimationEvent(args, b)).toEqual({
      type: 'heal',
      pokemon: 'p1a: Charizard',
      prevHp: 50,
      newHp: 75,
      maxHp: 100,
    });
  });

  // ── faint ──────────────────────────────────────────────────────────

  it('faint → { type: faint, pokemon }', () => {
    const args = ['faint', 'p2a: Blastoise'];
    expect(extractAnimationEvent(args, battle)).toEqual({
      type: 'faint',
      pokemon: 'p2a: Blastoise',
    });
  });

  // ── switch / drag ──────────────────────────────────────────────────

  it('switch → { type: switch-in, pokemon, species }', () => {
    const args = ['switch', 'p1a: Venusaur', 'Venusaur, L50, M', '100/100'];
    expect(extractAnimationEvent(args, battle)).toEqual({
      type: 'switch-in',
      pokemon: 'p1a: Venusaur',
      species: 'Venusaur',
    });
  });

  it('drag → { type: switch-in, pokemon, species }', () => {
    const args = ['drag', 'p2a: Skarmory', 'Skarmory, L50, F', '100/100'];
    expect(extractAnimationEvent(args, battle)).toEqual({
      type: 'switch-in',
      pokemon: 'p2a: Skarmory',
      species: 'Skarmory',
    });
  });

  // ── -boost / -unboost ──────────────────────────────────────────────

  it('-boost → { type: boost, pokemon, stat, amount }', () => {
    const args = ['-boost', 'p1a: Charizard', 'atk', '2'];
    expect(extractAnimationEvent(args, battle)).toEqual({
      type: 'boost',
      pokemon: 'p1a: Charizard',
      stat: 'atk',
      amount: 2,
    });
  });

  it('-boost with no amount → defaults to 1', () => {
    const args = ['-boost', 'p1a: Charizard', 'spe', undefined];
    expect(extractAnimationEvent(args, battle)).toEqual({
      type: 'boost',
      pokemon: 'p1a: Charizard',
      stat: 'spe',
      amount: 1,
    });
  });

  it('-unboost → { type: unboost, pokemon, stat, amount }', () => {
    const args = ['-unboost', 'p2a: Blastoise', 'def', '1'];
    expect(extractAnimationEvent(args, battle)).toEqual({
      type: 'unboost',
      pokemon: 'p2a: Blastoise',
      stat: 'def',
      amount: 1,
    });
  });

  // ── -status ────────────────────────────────────────────────────────

  it('-status → { type: status, pokemon, status }', () => {
    const args = ['-status', 'p2a: Blastoise', 'brn'];
    expect(extractAnimationEvent(args, battle)).toEqual({
      type: 'status',
      pokemon: 'p2a: Blastoise',
      status: 'brn',
    });
  });

  // ── -weather ───────────────────────────────────────────────────────

  it('-weather → { type: weather, weather }', () => {
    const args = ['-weather', 'Sandstorm'];
    expect(extractAnimationEvent(args, battle)).toEqual({
      type: 'weather',
      weather: 'Sandstorm',
    });
  });

  it('-weather "none" → returns null', () => {
    const args = ['-weather', 'none'];
    expect(extractAnimationEvent(args, battle)).toBeNull();
  });

  // ── -fieldstart ────────────────────────────────────────────────────

  it('-fieldstart with Terrain → { type: terrain }', () => {
    const args = ['-fieldstart', 'move: Electric Terrain'];
    expect(extractAnimationEvent(args, battle)).toEqual({
      type: 'terrain',
      terrain: 'Electric Terrain',
    });
  });

  it('-fieldstart without Terrain → returns null', () => {
    const args = ['-fieldstart', 'move: Trick Room'];
    expect(extractAnimationEvent(args, battle)).toBeNull();
  });

  // ── Modifier events ────────────────────────────────────────────────

  it('-supereffective → { type: supereffective }', () => {
    expect(extractAnimationEvent(['-supereffective', 'p2a: Blastoise'], battle)).toEqual({
      type: 'supereffective',
    });
  });

  it('-resisted → { type: resisted }', () => {
    expect(extractAnimationEvent(['-resisted', 'p2a: Blastoise'], battle)).toEqual({
      type: 'resisted',
    });
  });

  it('-crit → { type: crit }', () => {
    expect(extractAnimationEvent(['-crit', 'p2a: Blastoise'], battle)).toEqual({
      type: 'crit',
    });
  });

  it('-miss → { type: miss }', () => {
    expect(extractAnimationEvent(['-miss', 'p1a: Charizard'], battle)).toEqual({
      type: 'miss',
    });
  });

  // ── Unknown command ────────────────────────────────────────────────

  it('unknown command → returns null', () => {
    expect(extractAnimationEvent(['turn', '1'], battle)).toBeNull();
  });

  it('null args[0] → returns null', () => {
    expect(extractAnimationEvent([null], battle)).toBeNull();
  });
});
