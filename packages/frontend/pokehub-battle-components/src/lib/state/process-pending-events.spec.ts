import { processPendingEvents } from './process-pending-events';

// Zero out animation delays for test speed
jest.mock('../animations/easing', () => ({
  ...jest.requireActual('../animations/easing'),
  DURATION: {
    MOVE: 0,
    DAMAGE: 0,
    FAINT: 0,
    SWITCH_OUT: 0,
    SWITCH_IN: 0,
    BOOST: 0,
    STATUS: 0,
    SUPER_EFFECTIVE: 0,
    CRIT: 0,
    WEATHER: 0,
    SCREEN_SHAKE: 0,
    FLASH: 0,
    POPUP: 0,
    LOG_READ: 0,
  },
}));

function makePending(cmd, animEvent = null, args = [cmd], kwArgs = {}) {
  return { args, kwArgs, animEvent };
}

function createDeps(overrides = {}) {
  return {
    battle: {
      add: jest.fn(),
      p1: { active: [{ name: 'Charizard', fainted: false }] },
      p2: { active: [{ name: 'Blastoise', fainted: false }] },
      request: null,
    },
    formatter: {
      formatHTML: jest.fn().mockReturnValue('<p>log</p>'),
      perspective: null,
    },
    pending: [],
    skipRef: { current: false },
    rawDispatch: jest.fn(),
    ...overrides,
  };
}

describe('processPendingEvents', () => {
  let playAnimation;

  beforeEach(() => {
    playAnimation = jest.fn().mockResolvedValue(undefined);
  });

  // ── Empty pending ──────────────────────────────────────────────────

  it('empty pending → returns empty array, no dispatches', async () => {
    const deps = createDeps({ pending: [] });
    const result = await processPendingEvents(deps, playAnimation);
    expect(result).toEqual([]);
    expect(deps.rawDispatch).not.toHaveBeenCalled();
    expect(playAnimation).not.toHaveBeenCalled();
  });

  // ── Move events ────────────────────────────────────────────────────

  it('move event → log appears before animation', async () => {
    const callOrder = [];
    const formatter = {
      formatHTML: jest.fn().mockReturnValue('<p>Charizard used Flamethrower!</p>'),
      perspective: null,
    };
    const rawDispatch = jest.fn().mockImplementation(() => callOrder.push('dispatch'));
    const anim = jest.fn().mockImplementation(async () => callOrder.push('animation'));

    const moveAnim = {
      type: 'move',
      attacker: 'p1a: Charizard',
      defender: 'p2a: Blastoise',
      moveName: 'Flamethrower',
    };

    const deps = createDeps({
      pending: [makePending('move', moveAnim, ['move', 'p1a: Charizard', 'Flamethrower', 'p2a: Blastoise'])],
      formatter,
      rawDispatch,
    });

    await processPendingEvents(deps, anim);

    // Log is dispatched before animation plays
    expect(callOrder[0]).toBe('dispatch');
    expect(callOrder[1]).toBe('animation');
  });

  // ── Damage (consequence) events ────────────────────────────────────

  it('damage event → animation first, then battle.add, then log dispatch', async () => {
    const callOrder = [];
    const battle = {
      add: jest.fn().mockImplementation(() => callOrder.push('battle.add')),
      p1: { active: [{ name: 'Charizard', fainted: false }] },
      p2: { active: [{ name: 'Blastoise', fainted: false }] },
      request: null,
    };
    const anim = jest.fn().mockImplementation(async () => callOrder.push('animation'));
    const rawDispatch = jest.fn().mockImplementation(() => callOrder.push('dispatch'));

    const damageAnim = {
      type: 'damage',
      pokemon: 'p2a: Blastoise',
      prevHp: 100,
      newHp: 50,
      maxHp: 100,
    };

    const deps = createDeps({
      battle,
      pending: [makePending('-damage', damageAnim, ['-damage', 'p2a: Blastoise', '50/100'])],
      rawDispatch,
    });

    await processPendingEvents(deps, anim);

    expect(callOrder).toContain('animation');
    expect(callOrder).toContain('battle.add');
    const animIdx = callOrder.indexOf('animation');
    const addIdx = callOrder.indexOf('battle.add');
    expect(animIdx).toBeLessThan(addIdx);
  });

  // ── Switch events ──────────────────────────────────────────────────

  it('switch event with animation → switch-out, battle.add, switch-in', async () => {
    const animCalls = [];
    const anim = jest.fn().mockImplementation(async (e) => {
      animCalls.push(e);
    });

    const switchAnim = {
      type: 'switch-in',
      pokemon: 'p1a: Venusaur',
      species: 'Venusaur',
    };

    const battle = {
      add: jest.fn(),
      p1: { active: [{ name: 'Charizard', fainted: false }] },
      p2: { active: [{ name: 'Blastoise', fainted: false }] },
      request: null,
    };

    const deps = createDeps({
      battle,
      pending: [makePending('switch', switchAnim, ['switch', 'p1a: Venusaur', 'Venusaur, L50, M', '100/100'])],
    });

    await processPendingEvents(deps, anim);

    // Should have switch-out then switch-in animations
    expect(animCalls.length).toBe(2);
    expect(animCalls[0].type).toBe('switch-out');
    expect(animCalls[1].type).toBe('switch-in');
    expect(battle.add).toHaveBeenCalled();
  });

  it('switch event without animation (skipRef=true) → battle.add + dispatch, no animation', async () => {
    const switchAnim = {
      type: 'switch-in',
      pokemon: 'p1a: Venusaur',
      species: 'Venusaur',
    };

    const deps = createDeps({
      pending: [makePending('switch', switchAnim, ['switch', 'p1a: Venusaur', 'Venusaur, L50, M', '100/100'])],
      skipRef: { current: true },
    });

    await processPendingEvents(deps, playAnimation);

    expect(playAnimation).not.toHaveBeenCalled();
    expect(deps.battle.add).toHaveBeenCalled();
    expect(deps.rawDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: '_BATTLE_UPDATED', turnProcessing: true })
    );
  });

  // ── Effectiveness merging ──────────────────────────────────────────

  it('supereffective followed by damage → merges modifier onto damage event', async () => {
    const damageAnim = {
      type: 'damage',
      pokemon: 'p2a: Blastoise',
      prevHp: 100,
      newHp: 30,
      maxHp: 100,
    };

    const deps = createDeps({
      pending: [
        makePending('-supereffective', { type: 'supereffective' }, ['-supereffective', 'p2a: Blastoise']),
        makePending('-damage', damageAnim, ['-damage', 'p2a: Blastoise', '30/100']),
      ],
    });

    await processPendingEvents(deps, playAnimation);

    // The damage event should have been merged with modifier
    const animCall = playAnimation.mock.calls.find(
      (c) => c[0].type === 'damage'
    );
    expect(animCall).toBeDefined();
    expect(animCall[0].modifier).toBe('supereffective');
    expect(animCall[0].skipHitSfx).toBe(true);
  });

  it('resisted followed by damage → merges modifier onto damage event', async () => {
    const damageAnim = {
      type: 'damage',
      pokemon: 'p2a: Blastoise',
      prevHp: 100,
      newHp: 90,
      maxHp: 100,
    };

    const deps = createDeps({
      pending: [
        makePending('-resisted', { type: 'resisted' }, ['-resisted', 'p2a: Blastoise']),
        makePending('-damage', damageAnim, ['-damage', 'p2a: Blastoise', '90/100']),
      ],
    });

    await processPendingEvents(deps, playAnimation);

    const animCall = playAnimation.mock.calls.find(
      (c) => c[0].type === 'damage'
    );
    expect(animCall).toBeDefined();
    expect(animCall[0].modifier).toBe('resisted');
  });

  // ── Rule / tier events ─────────────────────────────────────────────

  it('rule event → generates <small> HTML, calls battle.add', async () => {
    const deps = createDeps({
      pending: [makePending('rule', null, ['rule', 'Sleep Clause Mod'])],
    });

    const result = await processPendingEvents(deps);

    expect(deps.battle.add).toHaveBeenCalled();
    expect(result).toContain('<small>Sleep Clause Mod</small>');
  });

  it('tier event → generates <h2> HTML, calls battle.add', async () => {
    const deps = createDeps({
      pending: [makePending('tier', null, ['tier', '[Gen 9] OU'])],
    });

    const result = await processPendingEvents(deps);

    expect(deps.battle.add).toHaveBeenCalled();
    expect(result).toContain('<h2>[Gen 9] OU</h2>');
  });

  // ── Request event ──────────────────────────────────────────────────

  it('request event → sets formatter.perspective', async () => {
    const formatter = { formatHTML: jest.fn().mockReturnValue(null), perspective: null };
    const battle = {
      add: jest.fn(),
      request: { side: { id: 'p1' } },
      p1: { active: [{ name: 'Charizard', fainted: false }] },
      p2: { active: [{ name: 'Blastoise', fainted: false }] },
    };

    const deps = createDeps({
      battle,
      formatter,
      pending: [makePending('request', null, ['request', '{}'])],
    });

    await processPendingEvents(deps);

    expect(formatter.perspective).toBe('p1');
  });

  // ── skipRef.current = true ─────────────────────────────────────────

  it('skipRef=true → processes all events, no playAnimation calls', async () => {
    const moveAnim = {
      type: 'move',
      attacker: 'p1a: Charizard',
      defender: 'p2a: Blastoise',
      moveName: 'Flamethrower',
    };
    const damageAnim = {
      type: 'damage',
      pokemon: 'p2a: Blastoise',
      prevHp: 100,
      newHp: 50,
      maxHp: 100,
    };

    const deps = createDeps({
      pending: [
        makePending('move', moveAnim, ['move', 'p1a: Charizard', 'Flamethrower', 'p2a: Blastoise']),
        makePending('-damage', damageAnim, ['-damage', 'p2a: Blastoise', '50/100']),
      ],
      skipRef: { current: true },
    });

    await processPendingEvents(deps, playAnimation);

    expect(playAnimation).not.toHaveBeenCalled();
    expect(deps.battle.add).toHaveBeenCalledTimes(2);
  });

  // ── All dispatches have turnProcessing: true ───────────────────────

  it('all intermediate dispatches have turnProcessing: true', async () => {
    const damageAnim = {
      type: 'damage',
      pokemon: 'p2a: Blastoise',
      prevHp: 100,
      newHp: 50,
      maxHp: 100,
    };

    const deps = createDeps({
      pending: [makePending('-damage', damageAnim, ['-damage', 'p2a: Blastoise', '50/100'])],
    });

    await processPendingEvents(deps, playAnimation);

    const dispatches = deps.rawDispatch.mock.calls;
    for (const [event] of dispatches) {
      expect(event.turnProcessing).toBe(true);
    }
  });
});
