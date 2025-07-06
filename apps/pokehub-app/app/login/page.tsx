import { LoginForm } from '@pokehub/frontend/pokehub-auth-forms';
import { handleServerAuth } from '@pokehub/frontend/shared-app-router/server';

export default async function Login() {
  await handleServerAuth();

  return <LoginForm />;
}
