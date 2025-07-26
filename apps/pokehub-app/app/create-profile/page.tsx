import { handleServerAuth } from '../(utils)/handleServerAuth';
import { CreateProfileContainer } from './profile';

export default async function CreateProfilePage() {
  await handleServerAuth();

  return <CreateProfileContainer />;
}
