import { handleServerAuth } from '../(utils)/handleServerAuth';
import { LoginForm } from '@pokehub/frontend/pokehub-auth-forms';

export default async function Login() {
  await handleServerAuth();

  return <LoginForm />;
}
