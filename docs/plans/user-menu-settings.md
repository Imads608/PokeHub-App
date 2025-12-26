# User Menu & Settings Page - Phase 1

## Overview

Simplify the User Menu to contain only "Settings" and "Logout", and create a new Settings page for account management. This includes extracting a reusable avatar upload component.

## Current State

**Desktop User Menu (`user-dropdown.tsx`):**

- Settings, View Profile, Edit Profile, My Teams, Logout

**Mobile User Menu (`user-menu.tsx`):**

- View Profile, Edit Profile, My Teams, Settings
- (Logout is in main mobile menu)

## Target State

**Desktop User Menu:**

```
[Avatar + Username header]
─────────────────────────
Settings        →  /settings
─────────────────────────
Logout
```

**Mobile User Menu:**

```
← Back
Settings        →  /settings
```

_(Logout stays in main mobile menu)_

---

## Settings Page

### Route

`/settings` (privileged route - requires authentication)

### Sections

| Section         | Content                | Interaction                                             |
| --------------- | ---------------------- | ------------------------------------------------------- |
| **Profile**     | Avatar + Username      | View only                                               |
| **Account**     | Email, Username        | View only (with notes: "Google OAuth", "Cannot change") |
| **Avatar**      | Current avatar preview | Change button → upload                                  |
| **Danger Zone** | Delete account warning | Button → confirmation modal → hard delete               |

### Wireframe (Desktop)

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

### Wireframe (Mobile)

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

---

## Reusable Avatar Upload Component

Extract avatar upload functionality from `create-profile` into a reusable component.

### Location

`packages/frontend/pokehub-ui-components/src/lib/avatar-upload/`

### Components/Hooks

| Export            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `AvatarUpload`    | Component with avatar preview and upload button               |
| `useAvatarUpload` | Hook for SAS URL generation, blob upload, loading/error state |

### Usage

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

## Delete Account Flow

1. User clicks "Delete Account" button in Danger Zone
2. Confirmation modal appears with warning
3. User clicks "Delete Account" in modal to confirm
4. Frontend calls `DELETE /users/:userId`
5. Backend performs hard delete:
   - Delete user's teams from `teams` table
   - Delete avatar from Azure Blob Storage (if exists)
   - Delete user record from `users` table
6. Frontend calls `signOut()` to clear session
7. Redirect to `/login`

---

## Implementation Tasks

| #   | Task                                               | Files                                                                                   |
| --- | -------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | Extract Avatar Upload component/hook               | New: `packages/frontend/pokehub-ui-components/src/lib/avatar-upload/`                   |
| 2   | Refactor create-profile to use extracted component | `apps/pokehub-app/app/create-profile/profile.tsx`                                       |
| 3   | Update Desktop User Menu                           | `packages/frontend/pokehub-nav-components/src/lib/components/desktop/user-dropdown.tsx` |
| 4   | Update Mobile User Menu                            | `packages/frontend/pokehub-nav-components/src/lib/components/mobile/user-menu.tsx`      |
| 5   | Create Settings Page                               | New: `apps/pokehub-app/app/settings/page.tsx`                                           |
| 6   | Add `/settings` to privileged routes               | `apps/pokehub-app/router.ts`                                                            |
| 7   | Add Delete Account API endpoint                    | `apps/pokehub-api/src/users/users.controller.ts`                                        |
| 8   | Add delete user DB method                          | `packages/backend/pokehub-users-db/src/lib/pokehub-users-db.ts`                         |

---

## API Changes

### Update Profile Endpoint (Modified)

```
POST /users/:userId/profile
```

**Changes Made:**

- `username` is now optional in the request body
- Validation logic added:
  - If user already has a username and tries to change it → `400 Bad Request`
  - If user doesn't have a username and doesn't provide one → `400 Bad Request`
  - Avatar-only updates are allowed for users who already have a username

**Request Body:**

```typescript
{
  username?: string;  // Optional - only for first-time setup
  avatar?: string;    // Optional - filename of uploaded avatar
}
```

### Delete Account Endpoint

```
DELETE /users/:userId
```

**Guards:** `TokenAuthGuard` (ACCESS_TOKEN)

**Authorization:** User can only delete their own account (userId must match token)

**Response:**

- `204 No Content` on success
- `403 Forbidden` if userId doesn't match authenticated user
- `404 Not Found` if user doesn't exist

**Backend Logic:**

```typescript
async deleteUser(userId: string): Promise<void> {
  // 1. Delete user's teams
  await this.teamsDb.deleteTeamsByUserId(userId);

  // 2. Delete avatar from Azure Blob Storage
  const user = await this.usersDb.findById(userId);
  if (user?.avatarFilename) {
    await this.blobService.deleteAvatar(userId, user.avatarFilename);
  }

  // 3. Delete user record
  await this.usersDb.delete(userId);
}
```

---

## File Locations Reference

| Component                     | Current Location                                                                        |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| Desktop User Menu             | `packages/frontend/pokehub-nav-components/src/lib/components/desktop/user-dropdown.tsx` |
| Mobile User Menu              | `packages/frontend/pokehub-nav-components/src/lib/components/mobile/user-menu.tsx`      |
| Create Profile (avatar logic) | `apps/pokehub-app/app/create-profile/profile.tsx`                                       |
| Router Config                 | `apps/pokehub-app/router.ts`                                                            |
| Users Controller              | `apps/pokehub-api/src/users/users.controller.ts`                                        |
| Users DB                      | `packages/backend/pokehub-users-db/src/lib/pokehub-users-db.ts`                         |
| Teams DB                      | `packages/backend/pokehub-teams-db/src/lib/pokehub-teams-db.ts`                         |
