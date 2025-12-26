'use client';

import { withAuthRetry } from '../pokehub-api-client';
import { useAuthSession } from '@pokehub/frontend/shared-auth';
import { getFetchClient } from '@pokehub/frontend/shared-data-provider';
import type { IUpdateUserProfile } from '@pokehub/shared/shared-user-models';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface UpdateUserProfileData {
  username?: string;
  avatarFileName?: string;
}

export interface UseUpdateUserProfileOptions {
  /** Custom success message */
  successMessage?: string;
  /** Custom error message */
  errorMessage?: string;
  /** Callback on success */
  onSuccess?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export const useUpdateUserProfile = (
  options: UseUpdateUserProfileOptions = {}
) => {
  const {
    successMessage = 'Profile updated successfully',
    errorMessage = 'Failed to update profile',
    onSuccess,
    onError,
  } = options;

  const { data: session, update: updateSession } = useAuthSession();

  return useMutation({
    mutationFn: async (profileData: UpdateUserProfileData) => {
      const { accessToken, user } = session || {};
      if (!accessToken || !user) {
        throw new Error('Not authenticated');
      }

      const requestBody: IUpdateUserProfile = {};
      if (profileData.username) {
        requestBody.username = profileData.username;
      }
      if (profileData.avatarFileName) {
        requestBody.avatar = profileData.avatarFileName;
      }

      const resData = await withAuthRetry(accessToken, () =>
        getFetchClient('API').fetchThrowsError<IUpdateUserProfile>(
          `/users/${user.id}/profile`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(requestBody),
          }
        )
      );

      const res = await resData.json();

      // Update session with new data
      const updatedUser = { ...user };
      if (profileData.username) {
        updatedUser.username = profileData.username;
      }
      if (res.avatar) {
        updatedUser.avatarUrl = res.avatar;
      }

      await updateSession({
        ...session,
        user: updatedUser,
      });

      return res;
    },
    onSuccess: () => {
      toast.success(successMessage);
      onSuccess?.();
    },
    onError: (error) => {
      const errMessage = (error as Error).message || errorMessage;
      toast.error(errMessage);
      console.error('Error updating profile:', error);
      onError?.(error as Error);
    },
  });
};
