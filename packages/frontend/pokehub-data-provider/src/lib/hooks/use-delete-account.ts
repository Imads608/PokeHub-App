'use client';

import { withAuthRetry } from '../pokehub-api-client';
import { useAuthSession } from '@pokehub/frontend/shared-auth';
import { getFetchClient } from '@pokehub/frontend/shared-data-provider';
import { useMutation } from '@tanstack/react-query';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';

export interface UseDeleteAccountOptions {
  /** Redirect path after successful deletion */
  redirectTo?: string;
  /** Custom success message */
  successMessage?: string;
  /** Custom error message */
  errorMessage?: string;
  /** Callback on success (before redirect) */
  onSuccess?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export const useDeleteAccount = (options: UseDeleteAccountOptions = {}) => {
  const {
    redirectTo = '/login',
    successMessage = 'Account deleted successfully',
    errorMessage = 'Failed to delete account',
    onSuccess,
    onError,
  } = options;

  const { data: session } = useAuthSession();

  return useMutation({
    mutationFn: async () => {
      const { accessToken, user } = session || {};
      if (!accessToken || !user) {
        throw new Error('Not authenticated');
      }

      await withAuthRetry(accessToken, () =>
        getFetchClient('API').fetchThrowsError(`/users/${user.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      );
    },
    onSuccess: async () => {
      toast.success(successMessage);
      onSuccess?.();
      await signOut({ redirectTo });
    },
    onError: (error) => {
      const errMessage = (error as Error).message || errorMessage;
      toast.error(errMessage);
      console.error('Error deleting account:', error);
      onError?.(error as Error);
    },
  });
};
