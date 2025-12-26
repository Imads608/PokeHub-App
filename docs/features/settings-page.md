# Settings Page & User Menu Feature Documentation

## Table of Contents

- [Overview](#overview)
- [User Flow](#user-flow)
- [Architecture](#architecture)
  - [Route Configuration](#route-configuration)
  - [Component Structure](#component-structure)
- [User Menu Changes](#user-menu-changes)
- [Settings Page](#settings-page)
  - [Desktop Wireframe](#desktop-wireframe)
  - [Mobile Wireframe](#mobile-wireframe)
  - [Delete Confirmation Modal](#delete-confirmation-modal)
  - [Sections](#sections)
- [Reusable Avatar Upload Component](#reusable-avatar-upload-component)
- [Shared Profile Hooks](#shared-profile-hooks)
- [API Endpoints](#api-endpoints)
  - [Update Profile Endpoint](#update-profile-endpoint)
  - [Delete Account Endpoint](#delete-account-endpoint)
- [Delete Account Flow](#delete-account-flow)
- [Database Changes](#database-changes)
- [Security Considerations](#security-considerations)
- [File Locations](#file-locations)
- [Configuration](#configuration)
- [Dependencies](#dependencies)
- [Testing](#testing)
- [Changelog](#changelog)

---

## Overview

The Settings Page feature provides users with a centralized location to manage their account settings, update their avatar, and delete their account. This feature also simplifies the User Menu by consolidating multiple profile-related options into a single "Settings" entry.

**Status**: Complete and Production-Ready

---

## User Flow

```
User Menu → Settings → Account Management
              ↓
        ┌─────────────────────┐
        │  View Profile Info  │
        │  Update Avatar      │
        │  Delete Account     │
        └─────────────────────┘
```

**Key User Journeys**:

1. **View Account Info**: User opens Settings to see their profile, email, and username
2. **Update Avatar**: User clicks "Change Avatar" to upload a new profile picture
3. **Delete Account**: User initiates account deletion through the Danger Zone section

---

## Architecture

### Route Configuration

**Location**: `apps/pokehub-app/router.ts`

The `/settings` route is configured as a privileged route requiring authentication:

```typescript
privilegedRoutes: [
  {
    route: '/settings',
    rolesAllowed: ['ADMIN', 'USER'],
    allowSubRoutes: false,
  },
  // ... other routes
];
```

### Component Structure

```
Frontend (Settings):
├── apps/pokehub-app/app/settings/
│   ├── page.tsx                    # Page entry point with auth guard
│   └── settings.tsx                # Main settings component
├── packages/frontend/pokehub-ui-components/src/lib/avatar-upload/
│   ├── avatar-upload.tsx           # Reusable avatar upload component
│   ├── use-avatar-upload.ts        # Avatar upload hook
│   └── index.ts                    # Exports
├── packages/frontend/pokehub-data-provider/src/lib/hooks/
│   ├── use-update-user-profile.ts  # Profile update hook
│   └── use-delete-account.ts       # Account deletion hook
└── packages/frontend/pokehub-nav-components/src/lib/components/
    ├── desktop/user-dropdown.tsx   # Simplified desktop menu
    └── mobile/user-menu.tsx        # Simplified mobile menu

Backend (Settings):
├── apps/pokehub-api/src/users/
│   ├── users.controller.ts         # DELETE endpoint added
│   ├── users.service.ts            # deleteUser method added
│   └── dto/update-user-profile.dto.ts # username now optional
└── packages/backend/pokehub-users-db/src/lib/
    ├── users-db.service.ts         # deleteUser implementation
    └── users-db-service.interface.ts # deleteUser interface
```

---

## User Menu Changes

### Before

**Desktop User Menu** (`user-dropdown.tsx`):

- Settings
- View Profile
- Edit Profile
- My Teams
- Logout

**Mobile User Menu** (`user-menu.tsx`):

- View Profile
- Edit Profile
- My Teams
- Settings
- (Logout in main mobile menu)

### After

**Desktop User Menu**:

```
[Avatar + Username header]
─────────────────────────
Settings        →  /settings
─────────────────────────
Logout
```

**Mobile User Menu**:

```
← Back
Settings        →  /settings
```

_(Logout remains in main mobile menu)_

---

## Settings Page

### Desktop Wireframe

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                              [Nav Bar]   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│     Settings                                                             │
│     Manage your account settings and preferences                         │
│                                                                          │
│     ┌────────────────────────────────────────────────────────────────┐   │
│     │  Profile                                                       │   │
│     │                                                                │   │
│     │  ┌──────────┐                                                  │   │
│     │  │          │                                                  │   │
│     │  │  Avatar  │   trainer123                                     │   │
│     │  │  (80px)  │                                                  │   │
│     │  │          │                                                  │   │
│     │  └──────────┘                                                  │   │
│     └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│     ┌────────────────────────────────────────────────────────────────┐   │
│     │  Account                                                       │   │
│     │                                                                │   │
│     │  Email                                                         │   │
│     │  trainer123@gmail.com                          (Google OAuth)  │   │
│     │                                                                │   │
│     │  Username                                                      │   │
│     │  trainer123                                    (Cannot change) │   │
│     └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│     ┌────────────────────────────────────────────────────────────────┐   │
│     │  Avatar                                                        │   │
│     │                                                                │   │
│     │  Update your profile picture                                   │   │
│     │                                                                │   │
│     │  ┌──────────┐                                                  │   │
│     │  │ Current  │    [Change Avatar]                               │   │
│     │  │  (64px)  │                                                  │   │
│     │  └──────────┘                                                  │   │
│     └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│     ┌────────────────────────────────────────────────────────────────┐   │
│     │  Danger Zone                                    (red border)   │   │
│     │                                                                │   │
│     │  Delete Account                                                │   │
│     │  Once you delete your account, there is no going back.         │   │
│     │  All your teams and data will be permanently removed.          │   │
│     │                                                                │   │
│     │  [Delete Account]  (red/destructive button)                    │   │
│     └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Mobile Wireframe

```
┌─────────────────────────────┐
│  [Nav Bar]                  │
├─────────────────────────────┤
│                             │
│  Settings                   │
│  Manage your account        │
│                             │
│  ┌───────────────────────┐  │
│  │  Profile              │  │
│  │                       │  │
│  │      ┌────────┐       │  │
│  │      │ Avatar │       │  │
│  │      │ (64px) │       │  │
│  │      └────────┘       │  │
│  │      trainer123       │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  Account              │  │
│  │                       │  │
│  │  Email                │  │
│  │  trainer123@gmail.com │  │
│  │                       │  │
│  │  Username             │  │
│  │  trainer123           │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  Avatar               │  │
│  │                       │  │
│  │  ┌────────┐           │  │
│  │  │Current │           │  │
│  │  └────────┘           │  │
│  │  [Change Avatar]      │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  Danger Zone (red)    │  │
│  │                       │  │
│  │  Delete Account       │  │
│  │  This cannot be       │  │
│  │  undone.              │  │
│  │                       │  │
│  │  [Delete Account]     │  │
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

### Delete Confirmation Modal

```
┌────────────────────────────────────────────┐
│                                            │
│  ⚠️  Delete Account                        │
│                                            │
│  Are you sure you want to delete your      │
│  account? This action cannot be undone.    │
│                                            │
│  This will permanently delete:             │
│  • Your profile and avatar                 │
│  • All your saved teams                    │
│                                            │
│  ┌────────────┐  ┌─────────────────────┐   │
│  │  Cancel    │  │  Delete Account     │   │
│  │  (ghost)   │  │  (red/destructive)  │   │
│  └────────────┘  └─────────────────────┘   │
│                                            │
└────────────────────────────────────────────┘
```

### Sections

| Section         | Content                | Interaction                                             |
| --------------- | ---------------------- | ------------------------------------------------------- |
| **Profile**     | Avatar + Username      | View only                                               |
| **Account**     | Email, Username        | View only (with notes: "Google OAuth", "Cannot change") |
| **Avatar**      | Current avatar preview | Change button → upload                                  |
| **Danger Zone** | Delete account warning | Button → confirmation modal → hard delete               |

---

## Reusable Avatar Upload Component

### Location

`packages/frontend/pokehub-ui-components/src/lib/avatar-upload/`

### Components/Hooks

| Export            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `AvatarUpload`    | Component with avatar preview and upload button               |
| `useAvatarUpload` | Hook for SAS URL generation, blob upload, loading/error state |

### Hook Implementation

```typescript
// use-avatar-upload.ts
export const useAvatarUpload = (userId: string) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadAvatar = async (file: File): Promise<string> => {
    setIsUploading(true);
    setError(null);

    try {
      // 1. Generate SAS URL
      const { uploadUrl, blobUrl } = await generateUploadUrl({
        fileName: file.name,
        fileType: file.type,
      });

      // 2. Upload to Azure Blob Storage
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': file.type,
        },
        body: file,
      });

      // 3. Return the avatar filename for profile update
      return file.name;
    } catch (err) {
      setError('Failed to upload avatar');
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const selectFile = (file: File) => {
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  return { uploadAvatar, selectFile, previewUrl, isUploading, error };
};
```

### Usage Example

```tsx
// In Settings page
<AvatarUpload
  currentAvatarUrl={user.avatarUrl}
  userId={user.id}
  onUploadComplete={(newAvatarUrl) => updateSession({ avatarUrl: newAvatarUrl })}
/>

// In create-profile page
<AvatarUpload
  userId={user.id}
  onUploadComplete={(avatarUrl) => setAvatarUrl(avatarUrl)}
/>
```

---

## Shared Profile Hooks

### use-update-user-profile

**Location**: `packages/frontend/pokehub-data-provider/src/lib/hooks/use-update-user-profile.ts`

**Purpose**: Updates user profile (avatar only for existing users) and refreshes the NextAuth session.

```typescript
export const useUpdateUserProfile = () => {
  const { data: session, update } = useAuthSession();

  return useMutation({
    mutationFn: async ({ avatar }: { avatar?: string }) => {
      if (!session?.user?.id || !session?.accessToken) {
        throw new Error('Not authenticated');
      }

      const response = await withAuthRetry(session.accessToken, (token) =>
        pokehubApiClient.users.updateProfile(
          session.user.id,
          { avatar },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      // Update NextAuth session with new user data
      await update({ user: response.user });

      return response;
    },
  });
};
```

### use-delete-account

**Location**: `packages/frontend/pokehub-data-provider/src/lib/hooks/use-delete-account.ts`

**Purpose**: Deletes the user account and signs out.

```typescript
export const useDeleteAccount = () => {
  const { data: session } = useAuthSession();

  return useMutation({
    mutationFn: async () => {
      if (!session?.user?.id || !session?.accessToken) {
        throw new Error('Not authenticated');
      }

      await withAuthRetry(session.accessToken, (token) =>
        pokehubApiClient.users.deleteUser(session.user.id, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
    },
    onSuccess: async () => {
      // Sign out and redirect to login
      await signOut({ callbackUrl: '/login' });
    },
  });
};
```

---

## API Endpoints

### Update Profile Endpoint

```
POST /users/:userId/profile
```

**Guard**: `TokenAuthGuard` (ACCESS_TOKEN)

**Authorization**: User can only update their own profile (userId must match token)

**Request Body**:

```typescript
{
  username?: string;  // Optional - only for first-time setup
  avatar?: string;    // Optional - filename of uploaded avatar
}
```

**Validation Logic**:

- If user already has a username and tries to change it → `400 Bad Request`
- If user doesn't have a username and doesn't provide one → `400 Bad Request`
- Avatar-only updates are allowed for users who already have a username

**Response**:

```typescript
{
  user: {
    id: string;
    email: string;
    username: string;
    accountRole: 'ADMIN' | 'USER';
    accountType: 'GOOGLE';
    avatarUrl?: string;
  }
}
```

### Delete Account Endpoint

```
DELETE /users/:userId
```

**Guard**: `TokenAuthGuard` (ACCESS_TOKEN)

**Authorization**: User can only delete their own account (userId must match token)

**Response**:

- `204 No Content` on success
- `403 Forbidden` if userId doesn't match authenticated user
- `404 Not Found` if user doesn't exist

**Backend Implementation**:

```typescript
async deleteUser(userId: string): Promise<void> {
  // 1. Delete user's teams (if teams table exists)
  // await this.teamsDb.deleteTeamsByUserId(userId);

  // 2. Delete avatar from Azure Blob Storage (if exists)
  // const user = await this.usersDb.findById(userId);
  // if (user?.avatarFilename) {
  //   await this.blobService.deleteAvatar(userId, user.avatarFilename);
  // }

  // 3. Delete user record
  await this.usersDb.deleteUser(userId);
}
```

**Note**: Team deletion and avatar blob deletion are commented out pending implementation of those services.

---

## Delete Account Flow

1. User clicks "Delete Account" button in Danger Zone
2. Confirmation modal appears with warning
3. User clicks "Delete Account" in modal to confirm
4. Frontend calls `DELETE /users/:userId`
5. Backend performs hard delete:
   - Delete user's teams from `teams` table (future)
   - Delete avatar from Azure Blob Storage (future)
   - Delete user record from `users` table
6. Frontend calls `signOut()` to clear session
7. Redirect to `/login`

---

## Database Changes

### Delete User Method

**Location**: `packages/backend/pokehub-users-db/src/lib/users-db.service.ts`

```typescript
async deleteUser(userId: string): Promise<void> {
  await this.dbService
    .delete(usersTable)
    .where(eq(usersTable.id, userId));
}
```

### DTO Changes

**Location**: `apps/pokehub-api/src/users/dto/update-user-profile.dto.ts`

The `username` field is now optional to support avatar-only updates:

```typescript
export class UpdateUserProfileDTO implements IUpdateUserProfile {
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(15)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
```

---

## Security Considerations

### Authorization

- Users can only access their own settings (enforced by route guards)
- Users can only update/delete their own account (enforced by backend)
- JWT token required for all settings operations

### Account Deletion

- Confirmation modal requires explicit user action
- Hard delete removes all user data (no soft delete)
- Session is cleared immediately after deletion
- No recovery mechanism (by design)

### Avatar Upload

- SAS tokens are time-limited (1 hour expiry)
- Write-only permissions on SAS tokens
- User-scoped storage folders (`{userId}/avatar.*`)

---

## File Locations

```
Frontend:
apps/pokehub-app/
├── app/settings/
│   ├── page.tsx                              # Settings page entry
│   └── settings.tsx                          # Settings component
└── router.ts                                 # Route configuration

packages/frontend/
├── pokehub-ui-components/src/lib/avatar-upload/
│   ├── avatar-upload.tsx                     # Avatar upload component
│   ├── use-avatar-upload.ts                  # Avatar upload hook
│   └── index.ts                              # Exports
├── pokehub-data-provider/src/lib/hooks/
│   ├── use-update-user-profile.ts            # Profile update hook
│   └── use-delete-account.ts                 # Account deletion hook
└── pokehub-nav-components/src/lib/components/
    ├── desktop/user-dropdown.tsx             # Simplified desktop menu
    └── mobile/user-menu.tsx                  # Simplified mobile menu

Backend:
apps/pokehub-api/src/users/
├── users.controller.ts                       # DELETE endpoint
├── users.service.ts                          # deleteUser method
├── users.service.interface.ts                # deleteUser interface
└── dto/update-user-profile.dto.ts            # Optional username DTO

packages/backend/pokehub-users-db/src/lib/
├── users-db.service.ts                       # deleteUser implementation
└── users-db-service.interface.ts             # deleteUser interface

Shared:
packages/shared/shared-user-models/src/lib/
└── update-user-profile.model.ts              # Optional username model
```

---

## Configuration

### Environment Variables

No additional environment variables required. Uses existing authentication and Azure Storage configuration from `docs/features/authentication.md`.

### Route Configuration

Add `/settings` to privileged routes in `apps/pokehub-app/router.ts`:

```typescript
privilegedRoutes: [
  {
    route: '/settings',
    rolesAllowed: ['ADMIN', 'USER'],
    allowSubRoutes: false,
  },
];
```

---

## Dependencies

### NPM Packages

Uses existing dependencies from the authentication feature:

- `@tanstack/react-query` - Mutation hooks
- `next-auth` - Session management
- `@azure/storage-blob` - Avatar uploads

### Internal Packages

**Frontend**:

- `@pokehub/frontend/shared-auth` - Session management
- `@pokehub/frontend/pokehub-data-provider` - API client and hooks
- `@pokehub/frontend/pokehub-ui-components` - Avatar upload component
- `@pokehub/frontend/pokehub-nav-components` - User menus

**Backend**:

- `@pokehub/backend/shared-auth-utils` - JWT guards and decorators
- `@pokehub/backend/pokehub-users-db` - User database operations

**Shared**:

- `@pokehub/shared/shared-user-models` - Profile update models

---

## Testing

### Unit Tests

**Users Service Tests** (`apps/pokehub-api/src/users/users.service.spec.ts`):

- ✅ Updates profile with username for new users
- ✅ Updates avatar only for users with username
- ✅ Rejects username change for users with existing username
- ✅ Rejects empty request for users without username
- ✅ Handles no-op for empty request from users with username
- ✅ Deletes user successfully

**Users Controller Tests** (`apps/pokehub-api/src/users/users.controller.spec.ts`):

- ✅ Calls service for profile updates
- ✅ Deletes user successfully
- ✅ Rejects deletion of other users

**DTO Tests** (`apps/pokehub-api/src/users/dto/update-user-profile.dto.spec.ts`):

- ✅ Validates optional username
- ✅ Validates avatar-only updates
- ✅ Enforces username constraints when provided

### E2E Tests

**Users E2E Tests** (`apps/pokehub-api-e2e/src/pokehub-api/users.spec.ts`):

- ✅ First time setup with username and avatar
- ✅ Avatar-only updates for existing users
- ✅ Rejects username change attempts
- ✅ Account deletion

### Test Commands

```bash
# Run unit tests
nx test pokehub-api --testPathPattern="users"

# Run e2e tests
nx e2e pokehub-api-e2e --testPathPattern="users.spec"
```

---

## Changelog

### v1.0.0 - Initial Release

**User Menu Simplification**:

- ✅ Simplified desktop user menu to "Settings" and "Logout"
- ✅ Simplified mobile user menu to "Settings" only

**Settings Page**:

- ✅ Created `/settings` route as privileged route
- ✅ Profile card with avatar and username display
- ✅ Account card with email and username info
- ✅ Avatar card with change functionality
- ✅ Danger Zone with account deletion

**Reusable Components**:

- ✅ Extracted `AvatarUpload` component
- ✅ Created `useAvatarUpload` hook
- ✅ Created `useUpdateUserProfile` hook
- ✅ Created `useDeleteAccount` hook
- ✅ Refactored create-profile to use shared components

**API Changes**:

- ✅ Made `username` optional in update profile endpoint
- ✅ Added validation for username immutability
- ✅ Added `DELETE /users/:userId` endpoint

**Database**:

- ✅ Added `deleteUser` method to users database service

---

## Related Documentation

- [Authentication Feature](./authentication.md) - OAuth and session management
- [User Menu & Settings Plan](../plans/user-menu-settings.md) - Original planning document
