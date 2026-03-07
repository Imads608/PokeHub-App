import {
  battleReducer,
  initialBattleUIState,
} from './battle-state-reducer';
import { TURN_TIMEOUT_SECONDS } from '@pokehub/shared/pokemon-battle-types';

describe('battleReducer', () => {
  let state;

  beforeEach(() => {
    state = { ...initialBattleUIState };
    jest.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => jest.restoreAllMocks());

  // ── RESET ──────────────────────────────────────────────────────────

  it('RESET → returns initialBattleUIState', () => {
    state.phase = 'battle';
    state.battleId = 'b1';
    expect(battleReducer(state, { type: 'RESET' })).toEqual(
      initialBattleUIState
    );
  });

  // ── Queue flow ─────────────────────────────────────────────────────

  it('QUEUE_JOINED → phase=queued, sets position, clears error', () => {
    state.error = { code: 'ERR', message: 'prev' };
    const next = battleReducer(state, { type: 'QUEUE_JOINED', position: 3 });
    expect(next.phase).toBe('queued');
    expect(next.queuePosition).toBe(3);
    expect(next.error).toBeNull();
  });

  it('QUEUE_LEFT → phase=idle, clears position', () => {
    state.phase = 'queued';
    state.queuePosition = 3;
    const next = battleReducer(state, { type: 'QUEUE_LEFT' });
    expect(next.phase).toBe('idle');
    expect(next.queuePosition).toBeNull();
  });

  // ── Match flow ─────────────────────────────────────────────────────

  it('MATCH_FOUND → phase=matched, sets opponent & battleId, clears queue', () => {
    state.phase = 'queued';
    state.queuePosition = 1;
    const next = battleReducer(state, {
      type: 'MATCH_FOUND',
      battleId: 'b1',
      opponent: { id: 'u2', name: 'Ash' },
    });
    expect(next.phase).toBe('matched');
    expect(next.battleId).toBe('b1');
    expect(next.opponent).toEqual({ id: 'u2', name: 'Ash' });
    expect(next.queuePosition).toBeNull();
  });

  it('MATCH_CANCELLED → phase=queued, clears battleId & opponent', () => {
    state.phase = 'matched';
    state.battleId = 'b1';
    state.opponent = { id: 'u2', name: 'Ash' };
    const next = battleReducer(state, {
      type: 'MATCH_CANCELLED',
      battleId: 'b1',
      reason: 'opponent_declined',
    });
    expect(next.phase).toBe('queued');
    expect(next.battleId).toBeNull();
    expect(next.opponent).toBeNull();
  });

  // ── Battle initialization ──────────────────────────────────────────

  it('_BATTLE_INITIALIZED → phase=battle, sets battleId, timer, logEntries', () => {
    const logs = ['<p>Battle started!</p>'];
    const next = battleReducer(state, {
      type: '_BATTLE_INITIALIZED',
      battleId: 'b1',
      logLines: logs,
    });
    expect(next.phase).toBe('battle');
    expect(next.battleId).toBe('b1');
    expect(next.pendingChoice).toBeNull();
    expect(next.turnTimer).toEqual({
      totalSeconds: TURN_TIMEOUT_SECONDS,
      startedAt: 1000,
    });
    expect(next.opponentDisconnected).toBe(false);
    expect(next.disconnectTimeout).toBeNull();
    expect(next.winner).toBeNull();
    expect(next.endReason).toBeNull();
    expect(next.canSaveReplay).toBe(false);
    expect(next.replaySaved).toBe(false);
    expect(next.error).toBeNull();
    expect(next.logEntries).toEqual(logs);
  });

  // ── Battle update ──────────────────────────────────────────────────

  it('_BATTLE_UPDATED → appends logLines, resets timer, clears pendingChoice', () => {
    state.phase = 'battle';
    state.logEntries = ['<p>Turn 1</p>'];
    state.pendingChoice = 'move 1';
    const next = battleReducer(state, {
      type: '_BATTLE_UPDATED',
      logLines: ['<p>Turn 2</p>'],
    });
    expect(next.logEntries).toEqual(['<p>Turn 1</p>', '<p>Turn 2</p>']);
    expect(next.pendingChoice).toBeNull();
    expect(next.turnProcessing).toBe(false);
  });

  it('_BATTLE_UPDATED with turnProcessing=true → sets flag', () => {
    const next = battleReducer(state, {
      type: '_BATTLE_UPDATED',
      logLines: [],
      turnProcessing: true,
    });
    expect(next.turnProcessing).toBe(true);
  });

  // ── Battle restored ────────────────────────────────────────────────

  it('_BATTLE_RESTORED → phase=battle, sets battleId, replaces logEntries', () => {
    state.logEntries = ['<p>old</p>'];
    const logs = ['<p>restored</p>'];
    const next = battleReducer(state, {
      type: '_BATTLE_RESTORED',
      battleId: 'b2',
      logLines: logs,
    });
    expect(next.phase).toBe('battle');
    expect(next.battleId).toBe('b2');
    expect(next.pendingChoice).toBeNull();
    expect(next.error).toBeNull();
    expect(next.logEntries).toEqual(logs);
    expect(next.turnTimer).toEqual({
      totalSeconds: TURN_TIMEOUT_SECONDS,
      startedAt: 1000,
    });
  });

  // ── Battle end ─────────────────────────────────────────────────────

  it('BATTLE_END → phase=ended, sets winner & reason, clears timer & disconnect', () => {
    state.phase = 'battle';
    state.turnTimer = { totalSeconds: 120, startedAt: 0 };
    state.opponentDisconnected = true;
    state.disconnectTimeout = 30;
    const next = battleReducer(state, {
      type: 'BATTLE_END',
      battleId: 'b1',
      winner: 'u1',
      reason: 'win',
      canSaveReplay: true,
    });
    expect(next.phase).toBe('ended');
    expect(next.winner).toBe('u1');
    expect(next.endReason).toBe('win');
    expect(next.canSaveReplay).toBe(true);
    expect(next.turnTimer).toBeNull();
    expect(next.opponentDisconnected).toBe(false);
    expect(next.disconnectTimeout).toBeNull();
  });

  // ── Turn warning ───────────────────────────────────────────────────

  it('TURN_WARNING → resets timer with secondsRemaining', () => {
    const next = battleReducer(state, {
      type: 'TURN_WARNING',
      battleId: 'b1',
      secondsRemaining: 15,
    });
    expect(next.turnTimer).toEqual({ totalSeconds: 15, startedAt: 1000 });
  });

  // ── Opponent disconnect / reconnect ────────────────────────────────

  it('OPPONENT_DISCONNECTED → sets flag & timeout', () => {
    const next = battleReducer(state, {
      type: 'OPPONENT_DISCONNECTED',
      battleId: 'b1',
      timeout: 30,
    });
    expect(next.opponentDisconnected).toBe(true);
    expect(next.disconnectTimeout).toBe(30);
  });

  it('OPPONENT_RECONNECTED → clears flag & timeout', () => {
    state.opponentDisconnected = true;
    state.disconnectTimeout = 30;
    const next = battleReducer(state, {
      type: 'OPPONENT_RECONNECTED',
      battleId: 'b1',
    });
    expect(next.opponentDisconnected).toBe(false);
    expect(next.disconnectTimeout).toBeNull();
  });

  // ── Replay ─────────────────────────────────────────────────────────

  it('REPLAY_SAVED → sets replaySaved=true', () => {
    const next = battleReducer(state, {
      type: 'REPLAY_SAVED',
      battleId: 'b1',
      replayCount: 5,
    });
    expect(next.replaySaved).toBe(true);
  });

  // ── Error ──────────────────────────────────────────────────────────

  it('ERROR → sets error object', () => {
    const next = battleReducer(state, {
      type: 'ERROR',
      code: 'INVALID_MOVE',
      message: 'Bad move',
      recoverable: true,
    });
    expect(next.error).toEqual({ code: 'INVALID_MOVE', message: 'Bad move' });
  });

  // ── Choice submitted / cancel ──────────────────────────────────────

  it('CHOICE_SUBMITTED → sets pendingChoice', () => {
    const next = battleReducer(state, {
      type: 'CHOICE_SUBMITTED',
      choice: 'move 1',
    });
    expect(next.pendingChoice).toBe('move 1');
  });

  it('CANCEL_CHOICE → clears pendingChoice', () => {
    state.pendingChoice = 'move 1';
    const next = battleReducer(state, { type: 'CANCEL_CHOICE' });
    expect(next.pendingChoice).toBeNull();
  });

  // ── Unknown event ──────────────────────────────────────────────────

  it('unknown event type → returns state unchanged', () => {
    const result = battleReducer(state, { type: 'COMPLETELY_UNKNOWN' });
    expect(result).toBe(state);
  });

  // ── Immutability ───────────────────────────────────────────────────

  it('does not mutate original state', () => {
    const original = { ...initialBattleUIState };
    battleReducer(state, { type: 'QUEUE_JOINED', position: 1 });
    expect(state).toEqual(original);
  });
});
