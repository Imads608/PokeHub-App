import type { ProfileFormData } from './profile.models';
import { useAuthSession } from '@pokehub/frontend/shared-auth';
import {
  FetchApiError,
  getFetchClient,
  withAuthRetry,
} from '@pokehub/frontend/shared-data-provider';
import type { BlobStorageResponse } from '@pokehub/frontend/shared-types';
import { isValidAvatarFileName } from '@pokehub/frontend/shared-utils';
import type { IUpdateUserProfile } from '@pokehub/shared/shared-user-models';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface CreateProfileMutationOptions {
  enbabled?: boolean;
}

export const useCreateProfile = (avatarFile: File | null) => {
  const { data, update } = useAuthSession();
  return useMutation({
    mutationFn: async (profile: ProfileFormData) => {
      if (!avatarFile) {
        throw new Error('Avatar file not selected');
      }

      if (!isValidAvatarFileName(avatarFile.name)) {
        throw new Error('Invalid avatar filename');
      }

      // 1. Get the secure upload URL
      const uploadUrlResponse = await getFetchClient(
        'NEXT_API'
      ).fetchThrowsError<BlobStorageResponse>('/api/generate-upload-url', {
        method: 'POST',
        body: JSON.stringify({
          fileName: avatarFile.name,
          fileType: avatarFile.type,
        }),
      });

      const { uploadUrl } = await uploadUrlResponse.json();

      // 2. Upload the file to Azure Blob Storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': avatarFile.type,
        },
        body: avatarFile,
      });

      if (!uploadResponse.ok) {
        throw new FetchApiError(
          'Failed to upload avatar',
          uploadResponse.status
        );
      }

      // 3. Save the profile data to the backend
      const { accessToken, user } = data || {};
      accessToken &&
        user &&
        (await withAuthRetry(accessToken, () =>
          getFetchClient('API').fetchThrowsError(`/users/${user.id}/profile`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              username: profile.username,
              avatar: avatarFile.name,
            } as IUpdateUserProfile),
          })
        ));

      await new Promise((resolve) => setTimeout(resolve, 5000));

      await update({ ...data, user: { ...user, username: profile.username } });
    },
    onSuccess: async () => {
      toast.success('Profile was updated successfully');
    },
    onError: (error) => {
      console.error('Error creating profile:', error);
      //setError('username', { message: 'Failed to create profile' });
    },
  });
};
