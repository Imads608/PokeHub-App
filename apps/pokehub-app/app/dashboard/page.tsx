import { handleServerAuth } from '../(utils)/handleServerAuth';

export default async function DashboardPage() {
  await handleServerAuth();
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Dashboard</h1>
      <p className="mt-4 text-lg">Welcome to your dashboard!</p>
    </div>
  );
}
