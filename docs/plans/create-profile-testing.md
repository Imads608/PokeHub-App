# Create-Profile Flow Test Plan

## Overview

This document describes the comprehensive testing strategy for the create-profile flow, covering unit, integration, and E2E tests. The create-profile flow allows new users (who authenticated via OAuth but haven't set up their profile) to choose a username and optionally upload an avatar.

## Current State

**Test Coverage Gaps:**

| Component                        | Has Tests | Notes                               |
| -------------------------------- | --------- | ----------------------------------- |
| `CreateProfileContainer`         | ❌        | No component tests                  |
| `useCreateProfile` hook          | ❌        | No hook tests                       |
| `useCheckUsername` hook          | ❌        | No hook tests                       |
| `profileSchema` (Zod)            | ❌        | No validation tests                 |
| `UsersService.updateUserProfile` | ❌        | Not covered in existing spec        |
| `UsersController` integration    | ❌        | Only HEAD endpoint partially tested |
| `UpdateUserProfileDTO`           | ❌        | No validation tests                 |
| E2E profile creation             | ❌        | No E2E coverage                     |

---

## Flow Architecture

### Data Flow

```
1. USER ARRIVES AT /create-profile
   ├── Server: handleServerAuth() checks session
   ├── Client: ClientRouteGuard verifies username is null
   └── Renders: CreateProfileContainer

2. USERNAME AVAILABILITY CHECK (debounced 500ms)
   Frontend: useCheckUsername hook
   ├── HEAD /users/{username}?dataType=username
   ├── Backend: UsersController.getUserCore()
   │   └── UsersService.getUserCore()
   │       └── UsersDBService.getUserByUsername()
   └── Returns: 200 (taken) or 404 (available)

3. AVATAR UPLOAD (if provided)
   Frontend: useCreateProfile mutation
   ├── POST /api/generate-upload-url (Next.js API route)
   │   └── Returns: { uploadUrl, blobUrl } with SAS token
   └── PUT {uploadUrl} (direct to Azure Blob Storage)

4. PROFILE CREATION
   Frontend: useCreateProfile mutation
   ├── POST /users/{userId}/profile
   │   Body: { username, avatar?: "filename.ext" }
   ├── Backend: UsersController.updateUserProfile()
   │   └── UsersService.updateUserProfile()
   │       └── UsersDBService.updateUserProfile()
   └── Returns: { username, avatar: "full-azure-url" }

5. SESSION UPDATE
   Frontend: session.update({ user: { ...user, username, avatarUrl } })
   └── Route guard redirects to dashboard
```

### Key Files

| Layer               | File                                                            | Purpose                       |
| ------------------- | --------------------------------------------------------------- | ----------------------------- |
| Frontend Page       | `apps/pokehub-app/app/create-profile/page.tsx`                  | Next.js route entry           |
| Frontend Component  | `apps/pokehub-app/app/create-profile/profile.tsx`               | `CreateProfileContainer` form |
| Frontend Validation | `apps/pokehub-app/app/create-profile/profile.models.ts`         | Zod schema                    |
| Frontend Hook       | `apps/pokehub-app/app/create-profile/useCreateProfile.tsx`      | Profile creation mutation     |
| Frontend Hook       | `apps/pokehub-app/app/create-profile/useCheckUsername.ts`       | Username availability query   |
| Backend Controller  | `apps/pokehub-api/src/users/users.controller.ts`                | HTTP endpoints                |
| Backend Service     | `apps/pokehub-api/src/users/users.service.ts`                   | Business logic                |
| Backend DTO         | `apps/pokehub-api/src/users/dto/update-user-profile.dto.ts`     | Request validation            |
| Database            | `packages/backend/pokehub-users-db/src/lib/users-db.service.ts` | DB operations                 |

---

## Pre-Implementation Fix

### Validation Mismatch

**Issue:** Frontend and backend have different username length requirements.

| Layer                     | Validation       | Min | Max |
| ------------------------- | ---------------- | --- | --- |
| Frontend (Zod)            | `min(5).max(15)` | 5   | 15  |
| Backend (class-validator) | `@Length(3, 20)` | 3   | 20  |

**Fix:** Align frontend to match backend: change `min(5)` to `min(3)` and `max(15)` to `max(20)`.

**Additional bug:** Error message in `profile.models.ts:6` says "at least 3 characters" but uses `min(5)`.

---

## 1. Unit Tests

### 1.1 Frontend - Zod Validation Schema

**File:** `apps/pokehub-app/app/create-profile/profile.models.spec.ts`

| Test Case                                              | Expected Result             |
| ------------------------------------------------------ | --------------------------- |
| Valid username (3-20 chars, alphanumeric + underscore) | Passes validation           |
| Username too short (`<3` chars)                        | Fails with min length error |
| Username too long (`>20` chars)                        | Fails with max length error |
| Username with special characters (`@#$%`)              | Fails regex validation      |
| Username with spaces                                   | Fails regex validation      |
| Username with only underscores (`___`)                 | Passes validation           |
| Optional avatar field (undefined)                      | Passes validation           |
| Optional avatar field (empty string)                   | Passes validation           |

---

### 1.2 Frontend - `useCheckUsername` Hook

**File:** `apps/pokehub-app/app/create-profile/useCheckUsername.spec.ts`

| Test Case                                             | Expected Result                                |
| ----------------------------------------------------- | ---------------------------------------------- |
| Query disabled when username is empty string          | `enabled: false`, no fetch                     |
| Returns null when username exists (200 response)      | Username is taken                              |
| Throws FetchApiError with 404 when username available | Username is available                          |
| Uses correct query key structure                      | `['users', username, { queryType, dataType }]` |
| Includes Authorization header                         | Bearer token from session                      |
| Uses HEAD method                                      | Not GET                                        |
| Does not retry on error                               | `retry: false`                                 |
| Handles missing session gracefully                    | No crash when `data` is undefined              |

**Mocks:**

```typescript
jest.mock('@pokehub/frontend/shared-auth', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('@pokehub/frontend/shared-data-provider', () => ({
  getFetchClient: jest.fn(),
}));
jest.mock('@pokehub/frontend/pokehub-data-provider', () => ({
  withAuthRetry: jest.fn(),
}));
```

---

### 1.3 Frontend - `useCreateProfile` Hook

**File:** `apps/pokehub-app/app/create-profile/useCreateProfile.spec.ts`

| Test Case                                      | Expected Result                                     |
| ---------------------------------------------- | --------------------------------------------------- |
| **Happy Path - No Avatar**                     |                                                     |
| Creates profile with username only             | Calls API without avatar field                      |
| Updates session with new username              | `session.update()` called                           |
| Shows success toast                            | `toast.success('Profile was updated successfully')` |
| **Happy Path - With Avatar**                   |                                                     |
| Validates avatar filename first                | Calls `isValidAvatarFileName()`                     |
| Requests upload URL                            | POST to `/api/generate-upload-url`                  |
| Uploads file to Azure URL                      | PUT with correct headers                            |
| Includes avatar filename in profile update     | `{ username, avatar: filename }`                    |
| Updates session with username and avatarUrl    | Uses URL from API response                          |
| **Error Cases**                                |                                                     |
| Rejects invalid avatar filename                | Throws before API call                              |
| Handles upload URL generation failure          | Shows error toast                                   |
| Handles Azure upload failure (non-ok response) | Throws `FetchApiError`                              |
| Handles profile update failure                 | Shows error toast with message                      |
| Handles missing session                        | No crash when `data` is undefined                   |

**Mocks:**

```typescript
jest.mock('@pokehub/frontend/shared-auth', () => ({
  useAuthSession: jest.fn(),
}));
jest.mock('@pokehub/frontend/shared-data-provider', () => ({
  getFetchClient: jest.fn(),
}));
jest.mock('@pokehub/frontend/pokehub-data-provider', () => ({
  withAuthRetry: jest.fn(),
}));
jest.mock('@pokehub/frontend/shared-utils', () => ({
  isValidAvatarFileName: jest.fn(),
}));
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
global.fetch = jest.fn(); // For Azure upload
```

---

### 1.4 Frontend - `CreateProfileContainer` Component

**File:** `apps/pokehub-app/app/create-profile/profile.spec.tsx`

| Test Case                                | Expected Result                      |
| ---------------------------------------- | ------------------------------------ |
| **Rendering**                            |                                      |
| Renders page title                       | "Create Your Trainer Profile"        |
| Renders username input with label        | Input with "Username" label          |
| Renders avatar upload button             | "Upload Avatar" button               |
| Renders submit button                    | "Create Profile" button              |
| **Username Validation**                  |                                      |
| Shows error for username < 3 chars       | Displays validation message          |
| Shows error for invalid characters       | Displays regex error message         |
| Clears error when username becomes valid | Error disappears                     |
| **Username Availability Feedback**       |                                      |
| Shows loader during availability check   | `Loader2` spinner visible            |
| Shows green check when available (404)   | `Check` icon with green color        |
| Shows red X when taken (200)             | `X` icon with red color              |
| Debounces check (500ms)                  | Only one API call after typing stops |
| **Avatar Upload**                        |                                      |
| Clicking upload opens file picker        | Hidden input triggered               |
| Selecting file updates preview           | `AvatarImage` src changes            |
| Accepts only valid file types            | `.png,.jpg,.jpeg,.gif`               |
| **Submit Button State**                  |                                      |
| Disabled when form invalid               | `disabled={true}`                    |
| Disabled when username taken             | `disabled={true}`                    |
| Disabled during submission               | `disabled={true}`                    |
| Disabled after successful submit         | `disabled={true}`                    |
| Enabled when valid + available           | `disabled={false}`                   |
| **Submission**                           |                                      |
| Shows loading text during submit         | "Creating Profile..."                |
| Calls mutation with form data            | `mutateAsync({ username, avatar })`  |

**Mocks:**

```typescript
jest.mock('./useCreateProfile', () => ({ useCreateProfile: jest.fn() }));
jest.mock('./useCheckUsername', () => ({ useCheckUsername: jest.fn() }));
```

---

### 1.5 Backend - `UsersService.updateUserProfile`

**File:** `apps/pokehub-api/src/users/users.service.spec.ts` (extend existing)

| Test Case                                      | Expected Result                                              |
| ---------------------------------------------- | ------------------------------------------------------------ |
| Updates username without avatar                | Calls DB with `{ username, avatarFilename: undefined }`      |
| Updates username with avatar                   | Calls DB with `{ username, avatarFilename: 'avatar.{ext}' }` |
| Normalizes avatar filename                     | `photo.png` becomes `avatar.png`                             |
| Extracts correct extension                     | `.jpg`, `.jpeg`, `.gif` all work                             |
| Returns data with full avatar URL              | `https://{account}.blob.core.windows.net/...`                |
| Returns data without avatar URL when no avatar | Original data returned                                       |
| Logs operation                                 | `logger.log()` called with user ID                           |

---

### 1.6 Backend - `UpdateUserProfileDTO` Validation

**File:** `apps/pokehub-api/src/users/dto/update-user-profile.dto.spec.ts`

| Test Case                                | Expected Result         |
| ---------------------------------------- | ----------------------- |
| Valid username (3-20 chars)              | Passes validation       |
| Username too short (2 chars)             | Fails `@Length(3, 20)`  |
| Username too long (21 chars)             | Fails `@Length(3, 20)`  |
| Valid avatar (`avatar.png`)              | Passes validation       |
| Valid avatar with numbers (`img123.jpg`) | Passes validation       |
| Avatar with invalid extension (`.txt`)   | Fails `@Matches`        |
| Avatar with special chars (`av@tar.png`) | Fails `@Matches`        |
| Avatar exceeds 255 chars                 | Fails `@Length(1, 255)` |
| Avatar is optional (undefined)           | Passes `@IsOptional`    |

---

## 2. Integration Tests

### 2.1 Backend - UsersController Integration

**File:** `apps/pokehub-api/src/users/users.controller.integration.spec.ts`

| Test Case                             | HTTP                                | Expected                             |
| ------------------------------------- | ----------------------------------- | ------------------------------------ |
| Creates profile successfully          | `POST /:userId/profile`             | 200, returns `{ username, avatar? }` |
| Requires authentication               | `POST /:userId/profile` (no token)  | 401                                  |
| Validates username min length         | `POST` with 2-char username         | 400                                  |
| Validates username max length         | `POST` with 21-char username        | 400                                  |
| Validates avatar filename pattern     | `POST` with `bad@file.txt`          | 400                                  |
| Handles empty body gracefully         | `POST` with `{}`                    | 200 (early return)                   |
| Returns 200 for existing username     | `HEAD /:username?dataType=username` | 200                                  |
| Returns 404 for non-existent username | `HEAD /:username?dataType=username` | 404                                  |

---

### 2.2 Frontend - CreateProfileContainer Integration

**File:** `apps/pokehub-app/app/create-profile/profile.integration.spec.tsx`

| Test Case                     | Description                                                    |
| ----------------------------- | -------------------------------------------------------------- |
| Full flow without avatar      | Type valid username → see green check → submit → success toast |
| Full flow with avatar         | Select file → preview shows → type username → submit → success |
| Username taken flow           | Type taken username → see red X → submit disabled              |
| API error during submission   | Submit → error → toast shows error message → form editable     |
| Session updates after success | Verify `session.update()` called with correct data             |

---

## 3. E2E Tests

### 3.1 Test User Strategy

**Challenge:** The existing `global-setup.ts` creates a user WITH a username, but create-profile tests need a user WITHOUT a username.

**Solution:** Reuse the existing `test-credentials` provider (which already supports `username: null`) and create a separate auth state file.

#### Changes to Global Setup

**File:** `apps/pokehub-app-e2e/src/global-setup.ts`

Add a second authentication flow that creates a "new user" without a username:

```typescript
// After existing authenticated user setup:
const newUserAuthFile = path.join(__dirname, '../.auth/new-user.json');

const newUser = {
  email: 'newuser@example.com',
  // No username - user needs to create profile
};

const response = await context.request.post(
  `${baseURL}/api/auth/callback/test-credentials`,
  {
    form: {
      csrfToken,
      email: newUser.email,
      // Omit username to create user without profile
    },
  }
);

await context.storageState({ path: newUserAuthFile });
```

#### Using Separate Auth State in Tests

```typescript
// apps/pokehub-app-e2e/src/create-profile.spec.ts
import { test, expect } from '@playwright/test';
import path from 'path';

// Use "new user" auth state for this test file
test.use({
  storageState: path.join(__dirname, '../.auth/new-user.json'),
});

test.describe('Create Profile Flow', () => {
  // Tests run as user without username
});
```

---

### 3.2 MSW Proxy Server Updates

**File:** `apps/pokehub-app-e2e/src/mocks/proxy-server.ts`

Add endpoints for mocking Azure Blob Storage:

```typescript
import path from 'path';

// Serve static test avatar image
app.get('/mock-avatars/:userId/:filename', (req, res) => {
  res.sendFile(path.join(__dirname, 'fixtures/test-avatar.png'));
});

// Mock Azure upload URL generation
app.post('/api/generate-upload-url', (req, res) => {
  const { fileName } = req.body;
  const ext = fileName?.split('.').pop() || 'png';
  res.json({
    uploadUrl: 'http://localhost:9876/mock-azure-upload',
    blobUrl: `http://localhost:9876/mock-avatars/test-user/avatar.${ext}`,
  });
});

// Mock Azure blob upload (PUT)
app.put('/mock-azure-upload', (req, res) => {
  res.status(201).send();
});

// Username availability check
app.head('/api/users/:username', (req, res) => {
  const takenUsernames = ['existinguser', 'admin', 'e2etestuser'];
  if (takenUsernames.includes(req.params.username.toLowerCase())) {
    res.status(200).send();
  } else {
    res.status(404).send();
  }
});
```

**Fixture to add:** `apps/pokehub-app-e2e/src/mocks/fixtures/test-avatar.png`

This approach allows:

- Avatar image to actually render in the UI during tests
- Verification that the avatar is visible after profile creation
- No external dependencies on Azure or placeholder services

---

### 3.3 Frontend E2E Tests (Playwright)

**File:** `apps/pokehub-app-e2e/src/create-profile.spec.ts`

| Test Case                             | Steps                                            | Assertions                                                  |
| ------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------- |
| **Route Guards**                      |                                                  |                                                             |
| Redirects new user to /create-profile | Navigate to /dashboard                           | URL is `/create-profile`                                    |
| Redirects existing user away          | (use default auth) → navigate to /create-profile | URL is `/dashboard`                                         |
| **Form Rendering**                    |                                                  |                                                             |
| Displays all form elements            | Navigate to /create-profile                      | Title, avatar upload, username input, submit button visible |
| **Username Validation**               |                                                  |                                                             |
| Shows error for short username        | Type "ab"                                        | Error message visible                                       |
| Shows error for invalid characters    | Type "user@name"                                 | Error message visible                                       |
| Clears error when valid               | Type "ab" → clear → type "validuser"             | Error not visible                                           |
| **Username Availability**             |                                                  |                                                             |
| Shows available indicator             | Type "newusername123"                            | Green check icon visible                                    |
| Shows taken indicator                 | Type "existinguser"                              | Red X icon visible                                          |
| Shows loading during check            | Type quickly                                     | Loader visible briefly                                      |
| **Avatar Upload**                     |                                                  |                                                             |
| Uploads and previews avatar           | Click upload → select file                       | Avatar preview updates                                      |
| Avatar renders after profile creation | Upload → submit → check UI                       | Avatar image visible                                        |
| **Form Submission**                   |                                                  |                                                             |
| Submits successfully without avatar   | Enter valid username → submit                    | Redirected, success toast                                   |
| Submits successfully with avatar      | Upload → enter username → submit                 | Avatar visible, redirected                                  |
| Button disabled when invalid          | Enter invalid username                           | Button is disabled                                          |
| Button disabled when taken            | Enter "existinguser"                             | Button is disabled                                          |

---

### 3.4 Backend E2E Tests (Jest + Supertest)

**File:** `apps/pokehub-api-e2e/src/pokehub-api/users.spec.ts` (extend existing)

| Test Case                                 | Setup                        | Expected                  |
| ----------------------------------------- | ---------------------------- | ------------------------- |
| Creates profile for new user              | Create user without username | 200, username saved in DB |
| Updates existing profile                  | User with existing username  | 200, username updated     |
| `HEAD` returns 200 for existing username  | User exists with username    | 200                       |
| `HEAD` returns 404 for available username | Username not in DB           | 404                       |

---

## 4. Implementation Order

| Phase | Tests                            | Files                                                      | Rationale         |
| ----- | -------------------------------- | ---------------------------------------------------------- | ----------------- |
| **0** | Fix validation mismatch          | `profile.models.ts`                                        | Prerequisite      |
| **1** | Backend unit tests               | `users.service.spec.ts`, `update-user-profile.dto.spec.ts` | Foundation        |
| **2** | Frontend unit tests (validation) | `profile.models.spec.ts`                                   | Schema tests      |
| **3** | Frontend unit tests (hooks)      | `useCheckUsername.spec.ts`, `useCreateProfile.spec.ts`     | Core logic        |
| **4** | Frontend unit tests (component)  | `profile.spec.tsx`                                         | UI behavior       |
| **5** | Backend integration tests        | `users.controller.integration.spec.ts`                     | API contract      |
| **6** | Frontend integration tests       | `profile.integration.spec.tsx`                             | Component + hooks |
| **7** | E2E setup                        | `global-setup.ts`, `proxy-server.ts`, fixtures             | Infrastructure    |
| **8** | E2E tests                        | `create-profile.spec.ts`, `users.spec.ts`                  | Full flow         |

---

## 5. Estimated Test Count

| Layer                        | New Tests         |
| ---------------------------- | ----------------- |
| Unit (Frontend - Validation) | ~8 tests          |
| Unit (Frontend - Hooks)      | ~20 tests         |
| Unit (Frontend - Component)  | ~17 tests         |
| Unit (Backend - Service)     | ~7 tests          |
| Unit (Backend - DTO)         | ~9 tests          |
| Integration (Backend)        | ~8 tests          |
| Integration (Frontend)       | ~5 tests          |
| E2E (Frontend)               | ~11 tests         |
| E2E (Backend)                | ~4 tests          |
| **Total**                    | **~89 new tests** |

---

## 6. Files to Create/Modify

### New Files

| Path                                                               | Purpose                      |
| ------------------------------------------------------------------ | ---------------------------- |
| `apps/pokehub-app/app/create-profile/profile.models.spec.ts`       | Zod schema tests             |
| `apps/pokehub-app/app/create-profile/useCheckUsername.spec.ts`     | Hook tests                   |
| `apps/pokehub-app/app/create-profile/useCreateProfile.spec.ts`     | Hook tests                   |
| `apps/pokehub-app/app/create-profile/profile.spec.tsx`             | Component tests              |
| `apps/pokehub-app/app/create-profile/profile.integration.spec.tsx` | Integration tests            |
| `apps/pokehub-api/src/users/dto/update-user-profile.dto.spec.ts`   | DTO validation tests         |
| `apps/pokehub-api/src/users/users.controller.integration.spec.ts`  | Controller integration tests |
| `apps/pokehub-app-e2e/src/create-profile.spec.ts`                  | E2E tests                    |
| `apps/pokehub-app-e2e/src/mocks/fixtures/test-avatar.png`          | Test fixture                 |

### Modified Files

| Path                                                    | Changes                           |
| ------------------------------------------------------- | --------------------------------- |
| `apps/pokehub-app/app/create-profile/profile.models.ts` | Fix validation to match backend   |
| `apps/pokehub-api/src/users/users.service.spec.ts`      | Add `updateUserProfile` tests     |
| `apps/pokehub-api-e2e/src/pokehub-api/users.spec.ts`    | Add profile creation E2E tests    |
| `apps/pokehub-app-e2e/src/global-setup.ts`              | Add new-user auth setup           |
| `apps/pokehub-app-e2e/src/mocks/proxy-server.ts`        | Add avatar/profile mock endpoints |

---

## 7. Related Documentation

- [Unit & Integration Testing Guide](../development/unit-integration-testing.md)
- [Frontend E2E Testing](../development/frontend-e2e-testing.md)
- [Backend E2E Testing](../development/backend-e2e-testing.md)
- [Authentication](../features/authentication.md)
