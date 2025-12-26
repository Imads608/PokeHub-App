'use client';

import type { ProfileFormData } from './profile.models';
import { useUpdateUserProfile } from '@pokehub/frontend/pokehub-data-provider';
import { useAvatarUpload } from '@pokehub/frontend/pokehub-ui-components';

export const useCreateProfile = () => {
  const {
    selectedFile: avatarFile,
    previewUrl: avatarPreviewUrl,
    error: avatarError,
    handleFileSelect,
    uploadAvatar,
    clearSelection,
  } = useAvatarUpload();

  const {
    mutateAsync: updateProfile,
    isPending,
    isSuccess,
  } = useUpdateUserProfile({
    successMessage: 'Profile created successfully',
    errorMessage: 'Failed to create profile',
  });

  const createProfile = async (profile: ProfileFormData) => {
    let avatarFileName: string | undefined;

    // 1. Upload avatar to Azure if selected
    if (avatarFile) {
      const result = await uploadAvatar();
      if (!result) {
        throw new Error('Failed to upload avatar');
      }
      avatarFileName = result.fileName;
    }

    // 2. Update profile with username and avatar
    await updateProfile({
      username: profile.username,
      avatarFileName,
    });

    clearSelection();
  };

  return {
    avatarFile,
    avatarPreviewUrl,
    avatarError,
    handleFileSelect,
    createProfile,
    isPending,
    isSuccess,
  };
};
