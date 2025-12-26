'use client';

import {
  useAvatarUpload,
  type UseAvatarUploadOptions,
} from './use-avatar-upload';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Input,
} from '@pokehub/frontend/shared-ui-components';
import { User, Upload, Loader2 } from 'lucide-react';
import { useRef } from 'react';

export interface AvatarUploadProps extends UseAvatarUploadOptions {
  /** Current avatar URL to display */
  currentAvatarUrl?: string | null;
  /** Fallback text (usually first letter of username) */
  fallbackText?: string;
  /** Size of the avatar in pixels */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the upload button */
  showUploadButton?: boolean;
  /** Custom button text */
  buttonText?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Test ID for the component */
  testId?: string;
}

const sizeClasses = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
};

const fallbackSizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export const AvatarUpload = ({
  currentAvatarUrl,
  fallbackText = 'U',
  size = 'lg',
  showUploadButton = true,
  buttonText = 'Change Avatar',
  disabled = false,
  testId = 'avatar-upload',
  onUploadComplete,
  onError,
}: AvatarUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { previewUrl, isUploading, error, handleFileSelect } = useAvatarUpload({
    onUploadComplete,
    onError,
  });

  const displayUrl = previewUrl || currentAvatarUrl;

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4" data-testid={testId}>
      <Avatar
        className={`${sizeClasses[size]} border-2 border-primary`}
        data-testid={`${testId}-avatar`}
      >
        <AvatarImage
          src={displayUrl || undefined}
          alt="Avatar"
          data-testid={`${testId}-image`}
        />
        <AvatarFallback className="bg-primary text-primary-foreground">
          {fallbackText ? (
            <span className="font-medium">
              {fallbackText.charAt(0).toUpperCase()}
            </span>
          ) : (
            <User className={fallbackSizeClasses[size]} />
          )}
        </AvatarFallback>
      </Avatar>

      {showUploadButton && (
        <div className="flex flex-col items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleButtonClick}
            disabled={disabled || isUploading}
            className="gap-2"
            data-testid={`${testId}-button`}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {buttonText}
              </>
            )}
          </Button>

          <Input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.gif"
            className="hidden"
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
            data-testid={`${testId}-input`}
          />

          {error && (
            <p
              className="text-xs text-destructive"
              data-testid={`${testId}-error`}
            >
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
