import { handleServerAuth } from '../(utils)/handleServerAuth';

export default async function TeamBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await handleServerAuth();

  return <>{children}</>;
}
