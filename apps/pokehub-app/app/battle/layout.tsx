import { handleServerAuth } from '../(utils)/handleServerAuth';

export default async function BattleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await handleServerAuth();

  return <>{children}</>;
}
