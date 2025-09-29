import { handleServerAuth } from '../(utils)/handleServerAuth';
import { LoginForm } from '@pokehub/frontend/pokehub-auth-forms/server';

export default async function Login() {
  await handleServerAuth();

  return <LoginForm />;
}
