import { PokeHubRouter } from '../../router';
import { handleServerAuth as handleServerAuthInternal } from '@pokehub/frontend/shared-app-router/server';

export const handleServerAuth = async () => {
  return await handleServerAuthInternal(PokeHubRouter);
};
