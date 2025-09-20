'use client';

import { type ProfileFormData, profileSchema } from './profile.models';
import { useCheckUsername } from './useCheckUsername';
import { useCreateProfile } from './useCreateProfile';
import { zodResolver } from '@hookform/resolvers/zod';
import { type FetchApiError } from '@pokehub/frontend/shared-data-provider';
import {
  Input,
  Button,
  Label,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@pokehub/frontend/shared-ui-components';
import { User, Upload, ChevronRight, Check, X, Loader2 } from 'lucide-react';
import type React from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

// Validation schema

export function CreateProfileContainer() {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid, isSubmitSuccessful },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: {
      username: '',
      avatar: '/placeholder.svg?height=100&width=100',
    },
  });

  const watchedUsername = watch('username');
  const watchedAvatar = watch('avatar');

  const [checkUsername, setCheckUsername] = useState<string>(watchedUsername);

  const {
    error: usernameCheckError,
    status,
    isLoading,
  } = useCheckUsername(checkUsername);

  const { mutateAsync } = useCreateProfile(avatarFile);

  // Debounced username check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (watchedUsername && !errors.username) {
        setCheckUsername(watchedUsername);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [watchedUsername, errors.username]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const imageUrl = URL.createObjectURL(file);
      setValue('avatar', imageUrl);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    await mutateAsync(data);
  };

  const getUsernameInputStatus = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    if (status === 'success') {
      return <X className="h-4 w-4 text-red-500" />;
    }
    if (
      status === 'error' &&
      (usernameCheckError as FetchApiError).status === 404
    ) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  const isFormReady =
    isValid &&
    status === 'error' &&
    (usernameCheckError as FetchApiError).status === 404;

  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/20 to-background"></div>

        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold md:text-4xl">
              Create Your Trainer Profile
            </h1>
            <p className="mt-2 text-muted-foreground">
              Choose your username and avatar to get started
            </p>
          </div>

          <Card className="border-2 border-primary/10">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Trainer Details</CardTitle>
              <CardDescription>
                Set up your basic profile information
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24 border-2 border-primary">
                    <AvatarImage
                      src={watchedAvatar || '/placeholder.svg'}
                      alt="Avatar"
                    />
                    <AvatarFallback>
                      <User className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex items-center gap-2">
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                        <Upload className="h-4 w-4" />
                        Upload Avatar
                      </div>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept=".png,.jpg,.jpeg,.gif"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </Label>
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="username"
                      {...register('username')}
                      placeholder="Enter your trainer name"
                      className={`pr-10 ${
                        errors.username || status === 'success'
                          ? 'border-destructive'
                          : status === 'error' &&
                            (usernameCheckError as FetchApiError).status === 404
                          ? 'border-green-500'
                          : ''
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {!errors.username && getUsernameInputStatus()}
                    </div>
                  </div>

                  {errors.username && (
                    <p className="text-xs text-destructive">
                      {errors.username.message}
                    </p>
                  )}

                  {/* {usernameStatus.error && ( */}
                  {/*   <p className="text-xs text-destructive"> */}
                  {/*     {usernameStatus.error} */}
                  {/*   </p> */}
                  {/* )} */}
                  {/**/}
                  {/* {usernameStatus.isAvailable === true && !errors.username && ( */}
                  {/*   <p className="text-xs text-green-600"> */}
                  {/*     Username is available! */}
                  {/*   </p> */}
                  {/* )} */}
                </div>
              </form>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting || !isFormReady || isSubmitSuccessful}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  <>
                    Create Profile
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
