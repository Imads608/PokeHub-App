'use client';

// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  ActiveBattleBar,
  BattleSocketProvider,
  useBattleSocketContext,
} from '@pokehub/frontend/pokehub-battle-components';
import { AppNav } from '@pokehub/frontend/pokehub-nav-components';

function BattleBar() {
  const { state } = useBattleSocketContext();
  const isActive = state.phase === 'battle' || state.phase === 'ended';
  if (!isActive) return null;
  return <ActiveBattleBar />;
}

function BattleAwareNav() {
  const { state } = useBattleSocketContext();
  const activeBattleId =
    state.phase === 'battle' || state.phase === 'ended'
      ? state.battleId ?? undefined
      : undefined;
  return <AppNav activeBattleId={activeBattleId} />;
}

export default function BattleShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BattleSocketProvider>
      <BattleAwareNav />
      {children}
      <BattleBar />
    </BattleSocketProvider>
  );
}
