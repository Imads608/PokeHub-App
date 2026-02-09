'use client';

import { useBattleNotifications } from '../hooks/use-battle-notifications';
import { useBattleSocket } from '../hooks/use-battle-socket';
import { useBattleState } from '../hooks/use-battle-state';
import type { BattleUIState } from '../types/battle-ui.types';
import { useAuthSession, getAuthSession } from '@pokehub/frontend/shared-auth';
import type { ServerBattleEvent } from '@pokehub/shared/pokemon-battle-types';
import { createContext, useCallback, useContext, useState } from 'react';

export interface BattleSocketContextValue {
  state: BattleUIState;
  isConnected: boolean;
  joinQueue: (format: string, teamId: string) => void;
  leaveQueue: () => void;
  declineMatch: (battleId: string) => void;
  submitMove: (battleId: string, choice: string) => void;
  forfeit: (battleId: string) => void;
  rejoin: (battleId: string) => void;
  saveReplay: (battleId: string) => void;
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

  const [state, dispatch] = useBattleState();
  const [lastEvent, setLastEvent] = useState<ServerBattleEvent | null>(null);

  // Track the last event for notifications
  const onEvent = useCallback(
    (event: ServerBattleEvent) => {
      // TOCTOU: If a MATCH_FOUND arrives when we're not in the queued phase,
      // auto-decline to avoid blocking the opponent.
      if (event.type === 'MATCH_FOUND' && state.phase !== 'queued') {
        emit({ type: 'DECLINE_MATCH', battleId: event.battleId });
        return;
      }

      dispatch(event);
      setLastEvent(event);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.phase]
  );

  const onAuthError = useCallback(() => {
    // Trigger a NextAuth session refresh. getAuthSession() calls /api/auth/session,
    // which runs the JWT callback on the server. The callback checks token expiry
    // and refreshes via GET /auth/access-token if needed. When the session updates,
    // accessToken changes → tokenRef updates → socket reconnects with the fresh token.
    void getAuthSession();
  }, []);

  const { isConnected, emit } = useBattleSocket({
    accessToken,
    onEvent,
    onAuthError,
  });

  // Notifications for battle events when user is away from /battle
  useBattleNotifications(state, lastEvent);

  // ── Action methods (typed ClientBattleEvent emissions) ──────────────

  const joinQueue = useCallback(
    (format: string, teamId: string) => {
      emit({ type: 'JOIN_QUEUE', format, teamId });
    },
    [emit]
  );

  const leaveQueue = useCallback(() => {
    emit({ type: 'LEAVE_QUEUE' });
  }, [emit]);

  const declineMatch = useCallback(
    (battleId: string) => {
      emit({ type: 'DECLINE_MATCH', battleId });
    },
    [emit]
  );

  const submitMove = useCallback(
    (battleId: string, choice: string) => {
      emit({ type: 'MOVE', battleId, choice });
    },
    [emit]
  );

  const forfeit = useCallback(
    (battleId: string) => {
      emit({ type: 'FORFEIT', battleId });
    },
    [emit]
  );

  const rejoin = useCallback(
    (battleId: string) => {
      emit({ type: 'REJOIN', battleId });
    },
    [emit]
  );

  const saveReplay = useCallback(
    (battleId: string) => {
      emit({ type: 'SAVE_REPLAY', battleId });
    },
    [emit]
  );

  const value: BattleSocketContextValue = {
    state,
    isConnected,
    joinQueue,
    leaveQueue,
    declineMatch,
    submitMove,
    forfeit,
    rejoin,
    saveReplay,
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
