'use client';

import {
  FetchApiError,
  getFetchClient,
} from '@pokehub/frontend/shared-data-provider';
import type { BlobStorageResponse } from '@pokehub/frontend/shared-types';
import { isValidAvatarFileName } from '@pokehub/frontend/shared-utils';
import { useState, useCallback } from 'react';

export interface UseAvatarUploadOptions {
  /** Callback when upload completes successfully */
  onUploadComplete?: (avatarUrl: string, fileName: string) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

export interface UseAvatarUploadReturn {
  /** The currently selected file (before upload) */
  selectedFile: File | null;
  /** Preview URL for the selected file */
  previewUrl: string | null;
  /** Whether an upload is in progress */
  isUploading: boolean;
  /** Error message if upload failed */
  error: string | null;
  /** Handle file selection from input */
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Upload the selected file to Azure Blob Storage */
  uploadAvatar: () => Promise<{ avatarUrl: string; fileName: string } | null>;
  /** Clear the selected file and preview */
  clearSelection: () => void;
}

export const useAvatarUpload = (
  options: UseAvatarUploadOptions = {}
): UseAvatarUploadReturn => {
  const { onUploadComplete, onError } = options;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      setError(null);

      if (!file) {
        return;
      }

      if (!isValidAvatarFileName(file.name)) {
        const errorMsg =
          'Invalid file type. Please use .png, .jpg, .jpeg, or .gif';
        setError(errorMsg);
        onError?.(new Error(errorMsg));
        return;
      }

      // Revoke previous preview URL to prevent memory leaks
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    },
    [previewUrl, onError]
  );

  const uploadAvatar = useCallback(async () => {
    if (!selectedFile) {
      return null;
    }

    setIsUploading(true);
    setError(null);

    try {
      // 1. Get the secure upload URL from our Next.js API
      const uploadUrlResponse = await getFetchClient(
        'NEXT_API'
      ).fetchThrowsError<BlobStorageResponse>('/api/generate-upload-url', {
        method: 'POST',
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
        }),
      });

      const { uploadUrl, blobUrl } = await uploadUrlResponse.json();

      // 2. Upload the file directly to Azure Blob Storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': selectedFile.type,
        },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new FetchApiError(
          'Failed to upload avatar',
          uploadResponse.status
        );
      }

      const result = { avatarUrl: blobUrl, fileName: selectedFile.name };
      onUploadComplete?.(result.avatarUrl, result.fileName);

      return result;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to upload avatar';
      setError(errorMsg);
      onError?.(err instanceof Error ? err : new Error(errorMsg));
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, onUploadComplete, onError]);

  const clearSelection = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  }, [previewUrl]);

  return {
    selectedFile,
    previewUrl,
    isUploading,
    error,
    handleFileSelect,
    uploadAvatar,
    clearSelection,
  };
};
