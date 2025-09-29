import { handleServerAuth } from '../(utils)/handleServerAuth';
import { DashComponent } from './dashboard';

export default async function DashboardPage() {
  await handleServerAuth();
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <DashComponent />
    </div>
  );
}
