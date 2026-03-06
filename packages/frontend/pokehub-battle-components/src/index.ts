// Context & Provider
export {
  BattleSocketProvider,
  useBattleSocketContext,
  type BattleSocketContextValue,
} from './lib/context/battle-socket.context';

// Types
export type { BattleUIState } from './lib/types/battle-ui.types';
export { initialBattleUIState } from './lib/state/battle-state-reducer';

// Guards
export { BattleGuard } from './lib/components/battle-guard';

// Lobby
export { BattleLobby } from './lib/components/lobby/battle-lobby';

// Battle UI
export { BattleContainer } from './lib/components/battlefield/battle-container';
export { ActiveBattleBar } from './lib/components/active-battle-bar';
