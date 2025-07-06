import { CreateProfileContainer } from './profile';
import { handleServerAuth } from '@pokehub/frontend/shared-app-router/server';

export default async function CreateProfilePage() {
  await handleServerAuth();

  return <CreateProfileContainer />;
}
