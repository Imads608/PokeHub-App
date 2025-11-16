import { handleServerAuth } from '../(utils)/handleServerAuth';

export default async function TeamBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // await for 5 seconds to simulate a server-side delay
  await handleServerAuth();

  return <>{children}</>;
}
