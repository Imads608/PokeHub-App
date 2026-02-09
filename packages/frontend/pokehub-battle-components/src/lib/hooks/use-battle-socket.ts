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
  /** Whether the socket is currently connected. */
  isConnected: boolean;
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
 * Auth failure flow:
 * 1. Server validates token in `handleConnection`. If invalid it calls
 *    `client.disconnect()` → client receives `disconnect` with reason
 *    `"io server disconnect"` (socket.io does NOT auto-reconnect for this).
 * 2. `onAuthError` is called → parent refreshes the session → `accessToken`
 *    prop changes → token ref updates → second effect calls `socket.connect()`
 *    → auth callback reads the fresh token.
 */
export function useBattleSocket({
  accessToken,
  onEvent,
  onAuthError,
}: UseBattleSocketOptions): UseBattleSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Stable refs so socket listeners always use the latest callbacks
  // without re-triggering the creation effect.
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const onAuthErrorRef = useRef(onAuthError);
  onAuthErrorRef.current = onAuthError;
  const tokenRef = useRef(accessToken);
  tokenRef.current = accessToken;

  // ── Create socket once on mount ──────────────────────────────────────
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_POKEHUB_API_URL;
    if (!apiUrl) {
      console.error('[useBattleSocket] NEXT_PUBLIC_POKEHUB_API_URL is not set');
      return;
    }

    const socket = io(`${apiUrl}${BATTLE_NAMESPACE}`, {
      // Callback form: called on every (re)connection attempt so we always
      // send the latest token without recreating the socket.
      auth: (cb) => {
        cb({ token: tokenRef.current });
      },
      transports: ['websocket'],
      autoConnect: false,
    });

    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));

    socket.on('disconnect', (reason) => {
      setIsConnected(false);

      if (reason === 'io server disconnect') {
        // Server called socket.disconnect() — happens when handleConnection
        // rejects the token. Socket.io will NOT auto-reconnect for this
        // reason. Trigger a token refresh; the second useEffect will call
        // socket.connect() once the new token arrives.
        onAuthErrorRef.current();
      }
      // For 'ping timeout', 'transport close', 'transport error':
      //   socket.io handles reconnection automatically and the auth
      //   callback will read the latest token from tokenRef on each retry.
      // For 'io client disconnect':
      //   We initiated the disconnect (unmount cleanup) — no action needed.
    });

    socket.on(BATTLE_EVENT, (data: ServerBattleEvent) => {
      onEventRef.current(data);
    });

    // If we already have a token at mount time, connect immediately.
    if (tokenRef.current) {
      socket.connect();
    }

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
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
      socket.connect();
    }
  }, [accessToken]);

  // ── Typed emit ───────────────────────────────────────────────────────
  const emit = useCallback((event: ClientBattleEvent) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      console.warn('[useBattleSocket] Cannot emit: socket not connected');
      return;
    }

    // The gateway uses @SubscribeMessage(event.type) per event type,
    // so we emit the type as the socket event name with the rest as payload.
    const { type, ...payload } = event;
    socket.emit(type, payload);
  }, []);

  return { isConnected, emit };
}
