'use client';

import {
  useUpdateUserProfile,
  useDeleteAccount,
} from '@pokehub/frontend/pokehub-data-provider';
import { useAvatarUpload } from '@pokehub/frontend/pokehub-ui-components';
import { useAuthSession } from '@pokehub/frontend/shared-auth';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@pokehub/frontend/shared-ui-components';
import { AlertTriangle, Loader2, Upload, User } from 'lucide-react';
import { useRef, useState } from 'react';

export function SettingsContainer() {
  const { data: session } = useAuthSession();
  const user = session?.user;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    previewUrl,
    isUploading,
    error: avatarError,
    handleFileSelect,
    uploadAvatar,
    clearSelection,
  } = useAvatarUpload();

  const { mutateAsync: updateProfile, isPending: isSavingProfile } =
    useUpdateUserProfile({
      successMessage: 'Avatar updated successfully',
    });

  const { mutate: deleteAccount, isPending: isDeleting } = useDeleteAccount({
    onError: () => setIsDeleteDialogOpen(false),
  });

  const displayAvatarUrl = previewUrl || user?.avatarUrl;
  const isSaving = isUploading || isSavingProfile;

  const handleAvatarButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSaveAvatar = async () => {
    try {
      // 1. Upload to Azure Blob Storage
      const result = await uploadAvatar();
      if (!result) return;

      // 2. Update the backend with new avatar filename
      await updateProfile({ avatarFileName: result.fileName });

      clearSelection();
    } catch (error) {
      console.error('Error saving avatar:', error);
    }
  };

  const handleDeleteAccount = () => {
    deleteAccount();
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your public profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-primary">
                  <AvatarImage
                    src={displayAvatarUrl || undefined}
                    alt={user.username || 'User'}
                  />
                  <AvatarFallback className="bg-primary text-2xl font-medium text-primary-foreground">
                    {user.username?.charAt(0)?.toUpperCase() || (
                      <User className="h-10 w-10" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{user.username}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Email
                </p>
                <p className="text-sm">
                  {user.email}{' '}
                  <span className="text-muted-foreground">(Google OAuth)</span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Username
                </p>
                <p className="text-sm">
                  {user.username}{' '}
                  <span className="text-muted-foreground">(Cannot change)</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Avatar Card */}
          <Card>
            <CardHeader>
              <CardTitle>Avatar</CardTitle>
              <CardDescription>Update your profile picture</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary">
                  <AvatarImage
                    src={displayAvatarUrl || undefined}
                    alt={user.username || 'User'}
                  />
                  <AvatarFallback className="bg-primary text-xl font-medium text-primary-foreground">
                    {user.username?.charAt(0)?.toUpperCase() || (
                      <User className="h-8 w-8" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAvatarButtonClick}
                      disabled={isSaving}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {previewUrl ? 'Choose Different' : 'Choose File'}
                    </Button>
                    {previewUrl && (
                      <>
                        <Button
                          size="sm"
                          onClick={handleSaveAvatar}
                          disabled={isSaving}
                          className="gap-2"
                          data-testid="avatar-save-button"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save'
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearSelection}
                          disabled={isSaving}
                          data-testid="avatar-cancel-button"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                  {avatarError && (
                    <p className="text-xs text-destructive">{avatarError}</p>
                  )}
                </div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.gif"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={isSaving}
                />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone Card */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Once you delete your account, there is no going back.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  data-testid="delete-account-button"
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This will permanently delete:
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
              <li>Your profile and avatar</li>
              <li>All your saved teams</li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
              data-testid="dialog-cancel-button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              data-testid="dialog-confirm-delete-button"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
