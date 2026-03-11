'use client';

import { useBattleNotifications } from '../hooks/use-battle-notifications';
import { useBattleSocket, type BattleSocketStatus } from '../hooks/use-battle-socket';
import { useBattleState, type PlayAnimationFn } from '../hooks/use-battle-state';
import type { BattleUIState } from '../types/battle-ui.types';
import { useAuthSession, getAuthSession } from '@pokehub/frontend/shared-auth';
import { createClientLogger } from '@pokehub/frontend/shared-logger';
import type { ServerBattleEvent } from '@pokehub/shared/pokemon-battle-types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

const log = createClientLogger('BattleContext');

export interface BattleSocketContextValue {
  state: BattleUIState;
  /** Socket connection status: 'connecting', 'connected', or 'disconnected'. */
  socketStatus: BattleSocketStatus;
  /** True when the socket is connected AND the server can process battles. */
  connected: boolean;
  userId: string;
  joinQueue: (format: string, teamId?: string) => void;
  leaveQueue: () => void;
  declineMatch: (battleId: string) => void;
  submitMove: (battleId: string, choice: string) => void;
  cancelChoice: () => void;
  forfeit: (battleId: string) => void;
  rejoin: (battleId: string) => void;
  saveReplay: (battleId: string) => void;
  /** Process all pending protocol events, playing animations inline */
  processPendingEvents: (playAnimation?: PlayAnimationFn) => Promise<void>;
  /** Increments when new pending protocol events arrive */
  pendingVersion: number;
  /** Skip remaining animations (events still get applied) */
  skipAnimations: () => void;
  /** Queue player counts per format, updated in real-time while observing */
  queueCounts: Record<string, number>;
  /** Join the lobby room to receive real-time queue count updates */
  observeQueue: () => void;
  /** Leave the lobby room to stop receiving queue count updates */
  unobserveQueue: () => void;
}

const BattleSocketContext = createContext<BattleSocketContextValue | null>(
  null
);

export function BattleSocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useAuthSession();
  const accessToken = session?.accessToken;
  const userId = session?.user?.id ?? '';

  const [state, dispatch, processPendingEvents, pendingVersion, skipAnimations] = useBattleState();
  const [lastEvent, setLastEvent] = useState<ServerBattleEvent | null>(null);
  const [serverAvailable, setServerAvailable] = useState(true);
  const [queueCounts, setQueueCounts] = useState<Record<string, number>>({});

  // Track the last event for notifications
  const onEvent = useCallback(
    (event: ServerBattleEvent) => {
      // TOCTOU: If the user left the queue but MATCH_FOUND arrives before the
      // server processed LEAVE_QUEUE, auto-decline to avoid blocking the opponent.
      if (event.type === 'MATCH_FOUND' && state.phase === 'idle') {
        log.warn('MATCH_FOUND received while idle — auto-declining (TOCTOU)', {
          battleId: event.battleId,
        });
        emit({ type: 'DECLINE_MATCH', battleId: event.battleId });
        return;
      }

      // Queue counts are connection-level, not battle state
      if (event.type === 'QUEUE_COUNTS') {
        setQueueCounts(event.counts);
        return;
      }

      // Server status events are connection-level, not battle state
      if (event.type === 'SERVER_STATUS') {
        const available = event.status === 'restored';
        log.warn('Server status changed', { status: event.status });
        setServerAvailable(available);
        setLastEvent(event);
        return;
      }

      log.info('State transition', {
        event: event.type,
        fromPhase: state.phase,
        ...event,
      });
      dispatch(event);
      setLastEvent(event);

      // Non-recoverable errors should reset state back to idle
      if (event.type === 'ERROR' && !event.recoverable) {
        log.warn('Non-recoverable error — resetting to idle', {
          code: event.code,
        });
        dispatch({ type: 'RESET' });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.phase]
  );

  const onAuthError = useCallback(() => {
    log.warn('Auth error — refreshing session token');
    void getAuthSession();
  }, []);

  const { status: socketStatus, emit } = useBattleSocket({
    accessToken,
    onEvent,
    onAuthError,
  });

  const isConnected = socketStatus === 'connected';

  // Reset server availability on reconnect (optimistic — server will
  // notify us via SERVER_STATUS if Redis is still down).
  useEffect(() => {
    if (isConnected) {
      setServerAvailable(true);
    }
  }, [isConnected]);

  // Notifications for battle events when user is away from /battle
  useBattleNotifications(state, lastEvent);

  // ── Action methods (typed ClientBattleEvent emissions) ──────────────

  const joinQueue = useCallback(
    (format: string, teamId?: string) => {
      log.info('joinQueue', { format, teamId: teamId ?? 'random' });
      emit({
        type: 'JOIN_QUEUE',
        format,
        ...(teamId ? { teamId } : {}),
      });
    },
    [emit]
  );

  const leaveQueue = useCallback(() => {
    log.info('leaveQueue');
    emit({ type: 'LEAVE_QUEUE' });
  }, [emit]);

  const declineMatch = useCallback(
    (battleId: string) => {
      log.info('declineMatch', { battleId });
      emit({ type: 'DECLINE_MATCH', battleId });
    },
    [emit]
  );

  const submitMove = useCallback(
    (battleId: string, choice: string) => {
      log.info('submitMove', { battleId, choice });
      emit({ type: 'MOVE', battleId, choice });
      dispatch({ type: 'CHOICE_SUBMITTED', choice });
    },
    [emit, dispatch]
  );

  const cancelChoice = useCallback(() => {
    const battleId = state.battleId;
    log.info('cancelChoice', { battleId });
    if (battleId) {
      emit({ type: 'CANCEL_CHOICE', battleId });
    }
    dispatch({ type: 'CANCEL_CHOICE' });
  }, [emit, dispatch, state.battleId]);

  const forfeit = useCallback(
    (battleId: string) => {
      log.warn('forfeit', { battleId });
      emit({ type: 'FORFEIT', battleId });
    },
    [emit]
  );

  const rejoin = useCallback(
    (battleId: string) => {
      log.info('rejoin', { battleId });
      emit({ type: 'REJOIN', battleId });
    },
    [emit]
  );

  const saveReplay = useCallback(
    (battleId: string) => {
      log.info('saveReplay', { battleId });
      emit({ type: 'SAVE_REPLAY', battleId });
    },
    [emit]
  );

  const observeQueue = useCallback(() => {
    emit({ type: 'OBSERVE_QUEUE' });
  }, [emit]);

  const unobserveQueue = useCallback(() => {
    emit({ type: 'UNOBSERVE_QUEUE' });
  }, [emit]);

  const connected = isConnected && serverAvailable;

  const value: BattleSocketContextValue = {
    state,
    socketStatus,
    connected,
    userId,
    joinQueue,
    leaveQueue,
    declineMatch,
    submitMove,
    cancelChoice,
    forfeit,
    rejoin,
    saveReplay,
    processPendingEvents,
    pendingVersion,
    skipAnimations,
    queueCounts,
    observeQueue,
    unobserveQueue,
  };

  return (
    <BattleSocketContext.Provider value={value}>
      {children}
    </BattleSocketContext.Provider>
  );
}

export function useBattleSocketContext(): BattleSocketContextValue {
  const context = useContext(BattleSocketContext);
  if (!context) {
    throw new Error(
      'useBattleSocketContext must be used within a BattleSocketProvider'
    );
  }
  return context;
}

/** Returns the battle socket context, or null if outside the provider (e.g. during Suspense fallback). */
export function useBattleSocketContextOptional(): BattleSocketContextValue | null {
  return useContext(BattleSocketContext);
}
