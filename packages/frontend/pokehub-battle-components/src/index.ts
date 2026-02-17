// Context & Provider
export {
  BattleSocketProvider,
  useBattleSocketContext,
  type BattleSocketContextValue,
} from './lib/context/battle-socket.context';

// Types
export { type BattleUIState, initialBattleUIState } from './lib/types/battle-ui.types';

// Lobby
export { BattleLobby } from './lib/components/lobby/battle-lobby';

// Battle UI
export { BattleContainer } from './lib/components/battlefield/battle-container';
export { ActiveBattleBar } from './lib/components/active-battle-bar';
