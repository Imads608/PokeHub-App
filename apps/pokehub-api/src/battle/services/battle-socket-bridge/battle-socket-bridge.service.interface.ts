import type { ServerBattleEvent } from '@pokehub/shared/pokemon-battle-types';
import type { Server } from 'socket.io';

export const BATTLE_SOCKET_BRIDGE_SERVICE = 'BATTLE_SOCKET_BRIDGE_SERVICE';

export interface IBattleSocketBridgeService {
  /** Called once after gateway init to bind the Server instance */
  setServer(server: Server): void;

  /** Track a user's socket connection */
  registerSocket(socketId: string, userId: string): void;

  /** Remove a user's socket mapping */
  unregisterSocket(socketId: string, userId: string): void;

  /** Subscribe to per-user battle events (cross-server delivery) */
  subscribeUser(userId: string): void;

  /** Unsubscribe from per-user events */
  unsubscribeUser(userId: string): void;

  /** Subscribe to a battle's update channel */
  subscribeBattle(battleId: string): void;

  /** Emit event to user (direct if local, Redis pub/sub if remote) */
  emitToUser(userId: string, event: ServerBattleEvent): void;

  /** Get the socket ID for a user (for room joins) */
  getSocketId(userId: string): string | undefined;

  /** Get the Server instance (for room joins from other services) */
  getServer(): Server;

  /** Shutdown: clear heartbeat, disconnect subscriber */
  destroy(): Promise<void>;
}
