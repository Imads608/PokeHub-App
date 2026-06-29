'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type {
  ServerBattleEvent,
  ClientBattleEvent,
} from '@pokehub/shared/pokemon-battle-types';
import {
  BATTLE_NAMESPACE,
  BATTLE_EVENT,
} from '@pokehub/shared/pokemon-battle-types';
import { createClientLogger } from '@pokehub/frontend/shared-logger';

const log = createClientLogger('BattleSocket');

const MAX_AUTH_RETRIES = 3;
const CONNECTION_TIMEOUT_MS = 15_000;

export type BattleSocketStatus = 'connecting' | 'connected' | 'disconnected';

export interface UseBattleSocketOptions {
  /** Access token from the auth session. Socket connects when truthy. */
  accessToken: string | undefined;
  /** Callback for every server event received on the BATTLE_EVENT channel. */
  onEvent: (event: ServerBattleEvent) => void;
  /**
   * Called when the server rejects the connection (reason: "io server disconnect").
   * The parent should refresh the session; the updated token will be picked up
   * automatically on the next connection attempt via the token ref.
   */
  onAuthError: () => void;
}

export interface UseBattleSocketReturn {
  /** Current socket connection status. */
  status: BattleSocketStatus;
  /** Send a typed client event to the server. */
  emit: (event: ClientBattleEvent) => void;
}

/**
 * Manages a single long-lived Socket.io connection to the battle namespace.
 *
 * The socket is created once on mount with `autoConnect: false`. The `auth`
 * option is a callback that reads the latest token from a ref, so every
 * (re)connection attempt uses the freshest token without tearing down the
 * socket instance.
 *
 * Status lifecycle:
 * - `connecting` — initial connection or auto-reconnecting after a transient failure
 * - `connected` — socket is live and ready
 * - `disconnected` — terminal, won't auto-reconnect (session replaced by another
 *    tab, auth retries exhausted, or other permanent failure). Requires a page refresh.
 *
 * Auth failure flow:
 * 1. Server validates token in `handleConnection`. If invalid it calls
 *    `client.disconnect()` → client receives `disconnect` with reason
 *    `"io server disconnect"` (socket.io does NOT auto-reconnect for this).
 * 2. `onAuthError` is called → parent refreshes the session → `accessToken`
 *    prop changes → token ref updates → second effect calls `socket.connect()`
 *    → auth callback reads the fresh token.
 * 3. After {@link MAX_AUTH_RETRIES} consecutive failures, the socket gives up
 *    and transitions to `disconnected`.
 */
export function useBattleSocket({
  accessToken,
  onEvent,
  onAuthError,
}: UseBattleSocketOptions): UseBattleSocketReturn {
  const [status, setStatus] = useState<BattleSocketStatus>('connecting');
  const socketRef = useRef<Socket | null>(null);
  const pendingEventsRef = useRef<ClientBattleEvent[]>([]);
  const authRetryCount = useRef(0);
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable refs so socket listeners always use the latest callbacks
  // without re-triggering the creation effect.
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const onAuthErrorRef = useRef(onAuthError);
  onAuthErrorRef.current = onAuthError;
  const tokenRef = useRef(accessToken);
  tokenRef.current = accessToken;

  const clearConnectionTimeout = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, []);

  const startConnectionTimeout = useCallback(() => {
    clearConnectionTimeout();
    connectionTimeoutRef.current = setTimeout(() => {
      log.error(
        `Connection timeout after ${CONNECTION_TIMEOUT_MS / 1000}s — giving up`
      );
      const socket = socketRef.current;
      if (socket) {
        socket.disconnect();
      }
      setStatus('disconnected');
    }, CONNECTION_TIMEOUT_MS);
  }, [clearConnectionTimeout]);

  // ── Create socket once on mount ──────────────────────────────────────
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_POKEHUB_API_URL;
    if (!apiUrl) {
      log.error('NEXT_PUBLIC_POKEHUB_API_URL is not set');
      return;
    }

    // NEXT_PUBLIC_POKEHUB_API_URL includes the REST prefix (e.g., "http://localhost:3000/api").
    // WebSocket gateways in NestJS don't use the global prefix, so we need the
    // base server origin. Strip the path to get "http://localhost:3000".
    const baseUrl = new URL(apiUrl).origin;
    log.info(`Connecting to ${baseUrl}${BATTLE_NAMESPACE}`);

    const socket = io(`${baseUrl}${BATTLE_NAMESPACE}`, {
      // Callback form: called on every (re)connection attempt so we always
      // send the latest token without recreating the socket.
      auth: (cb) => {
        cb({ token: tokenRef.current });
      },
      transports: ['websocket'],
      autoConnect: false,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      log.info('Connected', { id: socket.id });
      authRetryCount.current = 0;
      clearConnectionTimeout();
      setStatus('connected');

      // Flush any events that were queued while disconnected
      const pending = pendingEventsRef.current;
      if (pending.length > 0) {
        log.info(`Flushing ${pending.length} pending event(s)`);
        pendingEventsRef.current = [];
        for (const event of pending) {
          const { type, ...payload } = event;
          log.debug('Flushing', { type, ...payload });
          socket.emit(type, payload);
        }
      }
    });

    socket.on('disconnect', (reason) => {
      log.warn('Disconnected', { reason });

      if (reason === 'io server disconnect') {
        // Server called socket.disconnect() — happens when handleConnection
        // rejects the token. Socket.io will NOT auto-reconnect for this
        // reason. Trigger a token refresh; the second useEffect will call
        // socket.connect() once the new token arrives.
        authRetryCount.current++;
        if (authRetryCount.current >= MAX_AUTH_RETRIES) {
          log.error(
            `Auth failed after ${MAX_AUTH_RETRIES} attempts — giving up`
          );
          socket.disconnect();
          setStatus('disconnected');
        } else {
          setStatus('connecting');
          onAuthErrorRef.current();
        }
      } else if (reason === 'io client disconnect') {
        // We initiated the disconnect (unmount cleanup or SESSION_REPLACED)
        // — no action needed, status is already set by the caller.
      } else {
        // 'ping timeout', 'transport close', 'transport error':
        //   socket.io handles reconnection automatically and the auth
        //   callback will read the latest token from tokenRef on each retry.
        setStatus('connecting');
      }
    });

    // Server emits SESSION_REPLACED when another tab connects for the same user.
    // This is a terminal state — disable auto-reconnect and require a refresh.
    socket.on('SESSION_REPLACED', () => {
      log.warn('Session replaced by another tab');
      setStatus('disconnected');
      socket.disconnect();
    });

    socket.on(BATTLE_EVENT, (data: ServerBattleEvent) => {
      log.debug('Received', data);
      onEventRef.current(data);
    });

    // If we already have a token at mount time, connect immediately.
    if (tokenRef.current) {
      startConnectionTimeout();
      socket.connect();
    }

    return () => {
      clearConnectionTimeout();
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      pendingEventsRef.current = [];
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Connect when token becomes available / is refreshed ──────────────
  // Handles two scenarios:
  //  1. Token was undefined at mount (session loading) → connect on arrival.
  //  2. Server rejected an expired token → parent refreshed session →
  //     accessToken changed → reconnect with the fresh token.
  useEffect(() => {
    tokenRef.current = accessToken;
    const socket = socketRef.current;

    // socket.active is true when connected OR actively reconnecting.
    // Only call connect() if the socket exists, has a token, and isn't
    // already connected or trying to reconnect.
    if (accessToken && socket && !socket.active) {
      startConnectionTimeout();
      socket.connect();
    }
  }, [accessToken, startConnectionTimeout]);

  // ── Typed emit ───────────────────────────────────────────────────────
  const emit = useCallback((event: ClientBattleEvent) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      log.info('Queuing event (socket not connected)', { type: event.type });
      pendingEventsRef.current.push(event);
      return;
    }

    const { type, ...payload } = event;
    log.debug('Emitting', { type, ...payload });
    socket.emit(type, payload);
  }, []);

  return { status, emit };
}
