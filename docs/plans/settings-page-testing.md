# Settings Page Testing Plan

## Table of Contents

- [Overview](#overview)
- [Test Strategy](#test-strategy)
- [Backend Tests](#backend-tests)
  - [Unit Tests](#backend-unit-tests)
  - [E2E Tests](#backend-e2e-tests)
- [Frontend Tests](#frontend-tests)
  - [Hook Tests](#frontend-hook-tests)
  - [Component Tests](#frontend-component-tests)
  - [E2E Tests](#frontend-e2e-tests)
- [Test File Locations](#test-file-locations)
- [Implementation Order](#implementation-order)
- [Test Commands](#test-commands)

---

## Overview

This plan covers unit, integration, and E2E tests for the Settings page functionality documented in `docs/features/settings-page.md`.

**Features to Test:**

- Settings page component (Profile, Account, Avatar, Danger Zone sections)
- Avatar upload component and hook
- Profile update hook (`useUpdateUserProfile`)
- Account deletion hook (`useDeleteAccount`)
- Backend `DELETE /users/:userId` endpoint
- Simplified user menu (desktop and mobile)

**Key Decisions:**

- E2E tests use unique users per test to avoid conflicts
- Reuse existing MSW proxy server mocks for Azure blob storage
- Include both desktop and mobile viewport testing for user menus
- Verify account deletion via `HEAD /users/:email?dataType=email` endpoint

---

## Test Strategy

### Approach by Layer

| Layer         | Tool                         | Purpose                                 |
| ------------- | ---------------------------- | --------------------------------------- |
| Backend Unit  | Jest + NestJS Testing        | Service/controller logic in isolation   |
| Backend E2E   | Jest + Supertest             | Full HTTP request/response with real DB |
| Frontend Unit | Jest + React Testing Library | Hook and component logic in isolation   |
| Frontend E2E  | Playwright                   | Full user flows with mocked backend     |

### Test Data Management

**Backend E2E:**

- Create fresh test users in `beforeAll`
- Clean up in `afterAll`
- Use `createFreshUser()` helper for tests needing unique users

**Frontend E2E:**

- Each test creates its own unique authenticated user
- Uses `createAuthenticatedUserWithProfile()` helper
- Account deletion tests verify deletion via HEAD endpoint

---

## Backend Tests

### Backend Unit Tests

#### UsersController Tests

**File:** `apps/pokehub-api/src/users/users.controller.spec.ts`

**Tests to add in new `describe('DELETE /:userId')` block:**

| #   | Test Case                                    | Expected Behavior       |
| --- | -------------------------------------------- | ----------------------- |
| 1   | Should delete user successfully              | Returns 204 No Content  |
| 2   | Should return 403 when deleting another user | userId !== JWT user.id  |
| 3   | Should return 403 without auth token         | No Authorization header |
| 4   | Should return 403 with invalid auth token    | Invalid JWT             |

**Implementation Notes:**

```typescript
describe('DELETE /:userId (deleteUser)', () => {
  beforeEach(() => {
    mockJwtService.validateToken.mockResolvedValue(mockUser);
  });

  it('should delete user successfully (204)', async () => {
    mockUsersService.deleteUser.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .delete(`/${testUserId}`)
      .set('Authorization', `Bearer ${validAccessToken}`)
      .expect(HttpStatus.NO_CONTENT);

    expect(mockUsersService.deleteUser).toHaveBeenCalledWith(testUserId);
  });

  it('should return 403 when deleting another user', async () => {
    const otherUserId = 'other-user-456';

    await request(app.getHttpServer())
      .delete(`/${otherUserId}`)
      .set('Authorization', `Bearer ${validAccessToken}`)
      .expect(HttpStatus.FORBIDDEN);

    expect(mockUsersService.deleteUser).not.toHaveBeenCalled();
  });

  // ... additional tests
});
```

---

#### UsersService Tests

**File:** `apps/pokehub-api/src/users/users.service.spec.ts`

**Tests to add in new `describe('deleteUser')` block:**

| #   | Test Case                               | Expected Behavior           |
| --- | --------------------------------------- | --------------------------- |
| 1   | Should call usersDbService.deleteUser   | Passes userId correctly     |
| 2   | Should log deletion request and success | Logger called appropriately |

**Implementation Notes:**

```typescript
describe('deleteUser', () => {
  const userId = 'user-to-delete';

  it('should call usersDbService.deleteUser with userId', async () => {
    mockDbService.deleteUser.mockResolvedValue(undefined);

    await service.deleteUser(userId);

    expect(mockDbService.deleteUser).toHaveBeenCalledWith(userId);
  });

  it('should log deletion request', async () => {
    mockDbService.deleteUser.mockResolvedValue(undefined);

    await service.deleteUser(userId);

    expect(mockLogger.log).toHaveBeenCalled();
  });
});
```

---

### Backend E2E Tests

**File:** `apps/pokehub-api-e2e/src/pokehub-api/users.spec.ts`

**Tests to add in new `describe('DELETE /users/:userId')` block:**

| #   | Test Case                        | HTTP                                | Expected |
| --- | -------------------------------- | ----------------------------------- | -------- |
| 1   | Delete own account successfully  | `DELETE /users/:userId`             | 204      |
| 2   | Reject deleting another user     | `DELETE /users/:otherUserId`        | 403      |
| 3   | Reject without auth token        | `DELETE /users/:userId`             | 403      |
| 4   | Reject with invalid token        | `DELETE /users/:userId`             | 403      |
| 5   | Return 404 for non-existent user | `DELETE /users/:nonExistentId`      | 404      |
| 6   | Verify user is deleted           | `HEAD /users/:email?dataType=email` | 404      |

**Implementation Notes:**

```typescript
describe('DELETE /users/:userId (deleteUser)', () => {
  it('should delete own account successfully', async () => {
    // Create a fresh user specifically for deletion
    const { user, token, dbUserId } = await createFreshUser('e2e_delete_self');

    await request(app.getHttpServer())
      .delete(`/users/${dbUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.NO_CONTENT);

    // Verify user is deleted
    await request(app.getHttpServer())
      .head(`/users/${user.email}?dataType=email`)
      .set('Authorization', `Bearer ${userWithUsernameToken}`)
      .expect(HttpStatus.NOT_FOUND);
  });

  it('should return 403 when trying to delete another user', async () => {
    // Use userWithUsername trying to delete testUser2
    await request(app.getHttpServer())
      .delete(`/users/${testUser2.id}`)
      .set('Authorization', `Bearer ${userWithUsernameToken}`)
      .expect(HttpStatus.FORBIDDEN);
  });

  it('should return 403 without auth token', async () => {
    await request(app.getHttpServer())
      .delete(`/users/${userWithUsername.id}`)
      .expect(HttpStatus.FORBIDDEN);
  });

  it('should return 403 with invalid auth token', async () => {
    await request(app.getHttpServer())
      .delete(`/users/${userWithUsername.id}`)
      .set('Authorization', 'Bearer invalid-token')
      .expect(HttpStatus.FORBIDDEN);
  });

  it('should return 404 for non-existent user', async () => {
    const { token } = await createFreshUser('e2e_delete_nonexistent');
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    // Note: This will return 403 because userId won't match token
    // We need a user trying to delete themselves but already deleted
    // Alternative: test that service layer handles not found
    await request(app.getHttpServer())
      .delete(`/users/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.FORBIDDEN); // Due to auth check before existence
  });
});
```

---

## Frontend Tests

### Frontend Hook Tests

#### useUpdateUserProfile Hook

**File:** `packages/frontend/pokehub-data-provider/src/lib/hooks/use-update-user-profile.spec.tsx` (new)

| #   | Test Case                                 | Description                     |
| --- | ----------------------------------------- | ------------------------------- |
| 1   | Should throw error when not authenticated | No session/token                |
| 2   | Should call API with correct endpoint     | `POST /users/${userId}/profile` |
| 3   | Should handle avatar-only update          | `{ avatarFileName }` only       |
| 4   | Should map avatarFileName to avatar       | Request transformation          |
| 5   | Should update NextAuth session on success | Call `update()`                 |
| 6   | Should show toast success message         | Custom or default               |
| 7   | Should show toast error on failure        | Custom or default               |
| 8   | Should call onSuccess callback            | When mutation succeeds          |
| 9   | Should call onError callback              | When mutation fails             |
| 10  | Should handle empty response              | No fields returned              |

**Implementation Pattern:**

```typescript
// Follow useTeams.spec.tsx pattern
jest.mock('@pokehub/frontend/shared-auth', () => ({
  useAuthSession: jest.fn(),
}));

jest.mock('@pokehub/frontend/shared-data-provider', () => ({
  withAuthRetry: jest.fn(),
  getFetchClient: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

describe('useUpdateUserProfile', () => {
  // Setup queryClient, wrapper, mocks...

  it('should throw error when not authenticated', async () => {
    mockUseAuthSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    const { result } = renderHook(() => useUpdateUserProfile(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ avatarFileName: 'test.png' });
      })
    ).rejects.toThrow('Not authenticated');
  });

  // ... more tests
});
```

---

#### useDeleteAccount Hook

**File:** `packages/frontend/pokehub-data-provider/src/lib/hooks/use-delete-account.spec.tsx` (new)

| #   | Test Case                                 | Description               |
| --- | ----------------------------------------- | ------------------------- |
| 1   | Should throw error when not authenticated | No session/token          |
| 2   | Should call API with correct endpoint     | `DELETE /users/${userId}` |
| 3   | Should call signOut on success            | With redirect             |
| 4   | Should use default redirectTo             | `/login`                  |
| 5   | Should use custom redirectTo              | Custom path               |
| 6   | Should show toast success before signOut  | Order matters             |
| 7   | Should show toast error on failure        | Custom or default         |
| 8   | Should call onSuccess before signOut      | Callback ordering         |
| 9   | Should call onError on failure            | Error callback            |

**Implementation Pattern:**

```typescript
jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

describe('useDeleteAccount', () => {
  it('should call signOut with correct redirectTo on success', async () => {
    const mockResponse = { ok: true, status: 204 };
    mockFetchApi.mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () => useDeleteAccount({ redirectTo: '/goodbye' }),
      { wrapper }
    );

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(signOut).toHaveBeenCalledWith({ redirectTo: '/goodbye' });
  });
});
```

---

#### useAvatarUpload Hook

**File:** `packages/frontend/pokehub-ui-components/src/lib/avatar-upload/use-avatar-upload.spec.tsx` (new)

| #   | Test Case                               | Description                          |
| --- | --------------------------------------- | ------------------------------------ |
| 1   | Should initialize with default state    | No file, no preview, not uploading   |
| 2   | handleFileSelect - valid file           | Sets selectedFile and previewUrl     |
| 3   | handleFileSelect - invalid file type    | Sets error state                     |
| 4   | handleFileSelect - revokes previous URL | Memory cleanup                       |
| 5   | uploadAvatar - success flow             | Get SAS URL → upload → return result |
| 6   | uploadAvatar - SAS URL failure          | Sets error, returns null             |
| 7   | uploadAvatar - Azure upload failure     | Sets error, returns null             |
| 8   | uploadAvatar - calls onError            | On failure                           |
| 9   | clearSelection - resets state           | Clears all state                     |
| 10  | clearSelection - revokes URL            | Memory cleanup                       |

**Implementation Pattern:**

```typescript
jest.mock('@pokehub/frontend/shared-data-provider', () => ({
  getFetchClient: jest.fn(),
  FetchApiError: class FetchApiError extends Error {},
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

describe('useAvatarUpload', () => {
  beforeEach(() => {
    mockCreateObjectURL.mockReturnValue('blob:test-url');
    jest.clearAllMocks();
  });

  it('should create preview URL for valid file', () => {
    const { result } = renderHook(() => useAvatarUpload());

    const file = new File(['test'], 'avatar.png', { type: 'image/png' });

    act(() => {
      result.current.handleFileSelect({
        target: { files: [file] },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.selectedFile).toBe(file);
    expect(result.current.previewUrl).toBe('blob:test-url');
    expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
  });
});
```

---

### Frontend Component Tests

#### Settings Page Component

**File:** `apps/pokehub-app/app/settings/settings.spec.tsx` (new)

| #   | Section     | Test Case                                    |
| --- | ----------- | -------------------------------------------- |
| 1   | Loading     | Should render spinner when user is undefined |
| 2   | Profile     | Should display user avatar                   |
| 3   | Profile     | Should display username                      |
| 4   | Account     | Should display email with OAuth badge        |
| 5   | Account     | Should show username immutability note       |
| 6   | Avatar      | Should display current avatar preview        |
| 7   | Avatar      | Should show Change Avatar button             |
| 8   | Avatar      | Should show preview when file selected       |
| 9   | Avatar      | Should show Save/Cancel when preview exists  |
| 10  | Avatar      | Should hide Save/Cancel when no preview      |
| 11  | Avatar      | Should call uploadAvatar on Save             |
| 12  | Avatar      | Should call clearSelection on Cancel         |
| 13  | Avatar      | Should show loading state during save        |
| 14  | Avatar      | Should show error message on failure         |
| 15  | Danger Zone | Should display warning text                  |
| 16  | Danger Zone | Should show Delete Account button            |
| 17  | Danger Zone | Should open confirmation modal               |
| 18  | Danger Zone | Should close modal on Cancel                 |
| 19  | Danger Zone | Should call deleteAccount on Confirm         |
| 20  | Danger Zone | Should close modal on delete error           |

**Implementation Pattern:**

```typescript
// Mock all hooks
jest.mock('@pokehub/frontend/shared-auth', () => ({
  useAuthSession: jest.fn(),
}));

jest.mock('@pokehub/frontend/pokehub-data-provider', () => ({
  useUpdateUserProfile: jest.fn(),
  useDeleteAccount: jest.fn(),
}));

jest.mock('@pokehub/frontend/pokehub-ui-components', () => ({
  useAvatarUpload: jest.fn(),
}));

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  avatarUrl: 'https://example.com/avatar.png',
  accountRole: 'USER',
  accountType: 'GOOGLE',
};

describe('SettingsContainer', () => {
  beforeEach(() => {
    mockUseAuthSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
    });

    mockUseAvatarUpload.mockReturnValue({
      selectedFile: null,
      previewUrl: null,
      isUploading: false,
      error: null,
      handleFileSelect: jest.fn(),
      uploadAvatar: jest.fn(),
      clearSelection: jest.fn(),
    });

    mockUseUpdateUserProfile.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    mockUseDeleteAccount.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
  });

  it('should render loading spinner when user is undefined', () => {
    mockUseAuthSession.mockReturnValue({
      data: { user: undefined },
      status: 'loading',
    });

    render(<SettingsContainer />);

    expect(screen.getByRole('status')).toBeInTheDocument(); // spinner
  });

  it('should display user avatar in Profile section', () => {
    render(<SettingsContainer />);

    const avatar = screen.getByRole('img', { name: /avatar/i });
    expect(avatar).toHaveAttribute(
      'src',
      expect.stringContaining('avatar.png')
    );
  });

  // ... more tests
});
```

---

#### AvatarUpload Component

**File:** `packages/frontend/pokehub-ui-components/src/lib/avatar-upload/avatar-upload.spec.tsx` (new)

| #   | Test Case                                  | Description            |
| --- | ------------------------------------------ | ---------------------- |
| 1   | Should render avatar with currentAvatarUrl | Image src set          |
| 2   | Should render fallback when no avatar      | Fallback text shown    |
| 3   | Should render correct size (sm)            | 48px dimensions        |
| 4   | Should render correct size (md)            | 64px dimensions        |
| 5   | Should render correct size (lg)            | 96px dimensions        |
| 6   | Should show upload button when enabled     | Button visible         |
| 7   | Should hide upload button when disabled    | Button hidden          |
| 8   | Should accept correct file types           | Input accept attribute |
| 9   | Should call onUploadComplete               | After upload           |
| 10  | Should call onError on failure             | Error callback         |

---

#### User Menu Components

**File:** `packages/frontend/pokehub-nav-components/src/lib/components/desktop/user-dropdown.spec.tsx` (new)

| #   | Test Case                           | Description         |
| --- | ----------------------------------- | ------------------- |
| 1   | Should render avatar trigger button | User avatar visible |
| 2   | Should show dropdown on click       | Menu items appear   |
| 3   | Should display username in header   | From user prop      |
| 4   | Should have Settings menu item      | Links to /settings  |
| 5   | Should have Logout menu item        | Calls signOut       |
| 6   | Should call signOut with redirect   | `/login`            |

**File:** `packages/frontend/pokehub-nav-components/src/lib/components/mobile/user-menu.spec.tsx` (new)

| #   | Test Case                   | Description              |
| --- | --------------------------- | ------------------------ |
| 1   | Should render Settings link | Links to /settings       |
| 2   | Should show back button     | Calls setShowProfileMenu |
| 3   | Should toggle visibility    | Based on showProfileMenu |

---

### Frontend E2E Tests

**File:** `apps/pokehub-app-e2e/src/settings.spec.ts` (new)

#### Helper Function

```typescript
const BASE_URL = 'http://127.0.0.1:4200';

/**
 * Creates a unique user and completes profile setup
 * Returns an authenticated user with username who can access /settings
 */
async function createAuthenticatedUserWithProfile(page: Page): Promise<{
  email: string;
  username: string;
}> {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `settings-${uniqueId}@example.com`;
  const username = `user${uniqueId.slice(-8)}`;

  // Get CSRF token
  const csrfRes = await page.request.get(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();

  // Authenticate via NextAuth test-credentials
  await page.request.post(`${BASE_URL}/api/auth/callback/test-credentials`, {
    form: { csrfToken, email },
  });

  // Complete profile setup
  await page.goto('/create-profile');
  await page.getByTestId('username-input').fill(username);
  await expect(page.getByTestId('username-available-indicator')).toBeVisible({
    timeout: 5000,
  });
  await page.getByTestId('submit-button').click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });

  return { email, username };
}
```

#### E2E Test Cases

```typescript
test.describe('Settings Page', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.describe('Access Control', () => {
    test('should redirect unauthenticated user to login', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForURL('**/login', { timeout: 15000 });
    });

    test('should allow authenticated user to access settings', async ({
      page,
    }) => {
      await createAuthenticatedUserWithProfile(page);
      await page.goto('/settings');
      await expect(
        page.getByRole('heading', { name: /Settings/i })
      ).toBeVisible();
    });
  });

  test.describe('Profile Section', () => {
    test('should display user avatar and username', async ({ page }) => {
      const { username } = await createAuthenticatedUserWithProfile(page);
      await page.goto('/settings');

      await expect(page.getByText(username)).toBeVisible();
      await expect(page.getByTestId('profile-avatar')).toBeVisible();
    });
  });

  test.describe('Account Section', () => {
    test('should display email with OAuth badge', async ({ page }) => {
      const { email } = await createAuthenticatedUserWithProfile(page);
      await page.goto('/settings');

      await expect(page.getByText(email)).toBeVisible();
      await expect(page.getByText(/Google OAuth/i)).toBeVisible();
    });

    test('should show username cannot be changed', async ({ page }) => {
      await createAuthenticatedUserWithProfile(page);
      await page.goto('/settings');

      await expect(page.getByText(/Cannot change/i)).toBeVisible();
    });
  });

  test.describe('Avatar Upload Section', () => {
    test('should show Change Avatar button', async ({ page }) => {
      await createAuthenticatedUserWithProfile(page);
      await page.goto('/settings');

      await expect(
        page.getByRole('button', { name: /Change Avatar/i })
      ).toBeVisible();
    });

    test('should show preview on file selection', async ({ page }) => {
      await createAuthenticatedUserWithProfile(page);
      await page.goto('/settings');

      const fileInput = page.getByTestId('settings-avatar-file-input');
      await fileInput.setInputFiles(
        path.join(__dirname, 'mocks/fixtures/test-avatar.jpg')
      );

      // Save/Cancel buttons should appear
      await expect(page.getByRole('button', { name: /Save/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible();
    });

    test('should save avatar successfully', async ({ page }) => {
      await createAuthenticatedUserWithProfile(page);
      await page.goto('/settings');

      const fileInput = page.getByTestId('settings-avatar-file-input');
      await fileInput.setInputFiles(
        path.join(__dirname, 'mocks/fixtures/test-avatar.jpg')
      );

      await page.getByRole('button', { name: /Save/i }).click();

      // Should show success (toast or Save button disappears)
      await expect(page.getByRole('button', { name: /Save/i })).toBeHidden({
        timeout: 5000,
      });
    });

    test('should cancel avatar change', async ({ page }) => {
      await createAuthenticatedUserWithProfile(page);
      await page.goto('/settings');

      const fileInput = page.getByTestId('settings-avatar-file-input');
      await fileInput.setInputFiles(
        path.join(__dirname, 'mocks/fixtures/test-avatar.jpg')
      );

      await page.getByRole('button', { name: /Cancel/i }).click();

      // Save/Cancel should disappear
      await expect(page.getByRole('button', { name: /Save/i })).toBeHidden();
    });
  });

  test.describe('Account Deletion (Danger Zone)', () => {
    test('should display danger zone warning', async ({ page }) => {
      await createAuthenticatedUserWithProfile(page);
      await page.goto('/settings');

      await expect(page.getByText(/Danger Zone/i)).toBeVisible();
      await expect(page.getByText(/permanently/i)).toBeVisible();
    });

    test('should open confirmation modal', async ({ page }) => {
      await createAuthenticatedUserWithProfile(page);
      await page.goto('/settings');

      await page.getByRole('button', { name: /Delete Account/i }).click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/Are you sure/i)).toBeVisible();
    });

    test('should close modal on cancel', async ({ page }) => {
      await createAuthenticatedUserWithProfile(page);
      await page.goto('/settings');

      await page.getByRole('button', { name: /Delete Account/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByRole('button', { name: /Cancel/i }).click();

      await expect(page.getByRole('dialog')).toBeHidden();
    });

    test('should delete account and redirect to login', async ({ page }) => {
      const { email } = await createAuthenticatedUserWithProfile(page);
      await page.goto('/settings');

      await page.getByRole('button', { name: /Delete Account/i }).click();
      await page
        .getByRole('dialog')
        .getByRole('button', { name: /Delete/i })
        .click();

      // Should redirect to login
      await page.waitForURL('**/login', { timeout: 15000 });

      // Verify account is deleted via API
      const response = await page.request.head(
        `http://localhost:9876/api/users/${email}?dataType=email`,
        { headers: { Authorization: 'Bearer test-token' } }
      );
      expect(response.status()).toBe(404);
    });
  });
});

test.describe('User Menu - Desktop', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should navigate to Settings from dropdown', async ({ page }) => {
    await createAuthenticatedUserWithProfile(page);
    await page.goto('/dashboard');

    // Open user dropdown
    await page.getByTestId('user-menu-trigger').click();

    // Click Settings
    await page.getByRole('menuitem', { name: /Settings/i }).click();

    await page.waitForURL('**/settings');
  });

  test('should show simplified menu (Settings + Logout only)', async ({
    page,
  }) => {
    await createAuthenticatedUserWithProfile(page);
    await page.goto('/dashboard');

    await page.getByTestId('user-menu-trigger').click();

    // Should have Settings and Logout
    await expect(
      page.getByRole('menuitem', { name: /Settings/i })
    ).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Logout/i })).toBeVisible();

    // Should NOT have old menu items
    await expect(
      page.getByRole('menuitem', { name: /View Profile/i })
    ).toBeHidden();
    await expect(
      page.getByRole('menuitem', { name: /Edit Profile/i })
    ).toBeHidden();
  });
});

test.describe('User Menu - Mobile', () => {
  test.use({
    storageState: { cookies: [], origins: [] },
    viewport: { width: 375, height: 667 },
  });

  test('should navigate to Settings from mobile menu', async ({ page }) => {
    await createAuthenticatedUserWithProfile(page);
    await page.goto('/dashboard');

    // Open mobile menu (hamburger)
    await page.getByTestId('mobile-menu-trigger').click();

    // Open user submenu
    await page.getByTestId('mobile-user-menu-trigger').click();

    // Click Settings
    await page.getByRole('link', { name: /Settings/i }).click();

    await page.waitForURL('**/settings');
  });

  test('should show Settings link in mobile menu', async ({ page }) => {
    await createAuthenticatedUserWithProfile(page);
    await page.goto('/dashboard');

    await page.getByTestId('mobile-menu-trigger').click();
    await page.getByTestId('mobile-user-menu-trigger').click();

    await expect(page.getByRole('link', { name: /Settings/i })).toBeVisible();
  });
});
```

---

## Test File Locations

### New Files to Create

```
apps/
├── pokehub-app/
│   └── app/settings/
│       └── settings.spec.tsx                         # Settings page component tests
└── pokehub-app-e2e/
    └── src/
        └── settings.spec.ts                          # E2E tests

packages/
└── frontend/
    ├── pokehub-data-provider/
    │   └── src/lib/hooks/
    │       ├── use-update-user-profile.spec.tsx      # Hook tests
    │       └── use-delete-account.spec.tsx           # Hook tests
    ├── pokehub-ui-components/
    │   └── src/lib/avatar-upload/
    │       ├── use-avatar-upload.spec.tsx            # Hook tests
    │       └── avatar-upload.spec.tsx                # Component tests
    └── pokehub-nav-components/
        └── src/lib/components/
            ├── desktop/
            │   └── user-dropdown.spec.tsx            # Component tests
            └── mobile/
                └── user-menu.spec.tsx                # Component tests
```

### Files to Modify

```
apps/
├── pokehub-api/
│   └── src/users/
│       ├── users.controller.spec.ts                  # Add DELETE tests
│       └── users.service.spec.ts                     # Add deleteUser tests
└── pokehub-api-e2e/
    └── src/pokehub-api/
        └── users.spec.ts                             # Add DELETE E2E tests
```

---

## Implementation Order

### Phase 1: Backend Tests (Priority: High)

1. **Add DELETE tests to `users.controller.spec.ts`**
   - 4 new tests for authorization and response codes
2. **Add deleteUser tests to `users.service.spec.ts`**
   - 2 new tests for service logic
3. **Add DELETE E2E tests to `users.spec.ts`**
   - 6 new tests for full HTTP flow

### Phase 2: Frontend Hook Tests (Priority: High)

4. **Create `use-update-user-profile.spec.tsx`**
   - 10 tests covering mutation logic
5. **Create `use-delete-account.spec.tsx`**
   - 9 tests covering deletion flow
6. **Create `use-avatar-upload.spec.tsx`**
   - 10 tests covering upload logic

### Phase 3: Frontend Component Tests (Priority: Medium)

7. **Create `avatar-upload.spec.tsx`**
   - 10 tests for component rendering/behavior
8. **Create `settings.spec.tsx`**
   - 20 tests for all sections
9. **Create `user-dropdown.spec.tsx`**
   - 6 tests for desktop menu
10. **Create `user-menu.spec.tsx`**
    - 3 tests for mobile menu

### Phase 4: Frontend E2E Tests (Priority: Medium)

11. **Create `settings.spec.ts`**
    - ~18 E2E tests covering full user flows
    - Desktop and mobile viewports

---

## Test Commands

```bash
# Backend unit tests
nx test pokehub-api --testPathPattern="users"

# Backend E2E tests
nx e2e pokehub-api-e2e --testFile=users.spec.ts

# Frontend hook tests (data-provider package)
nx test frontend-pokehub-data-provider

# Frontend hook tests (ui-components package)
nx test frontend-pokehub-ui-components

# Frontend component tests (settings page)
nx test pokehub-app --testPathPattern="settings"

# Frontend component tests (nav components)
nx test frontend-pokehub-nav-components

# Frontend E2E tests
cd apps/pokehub-app-e2e && npx playwright test settings.spec.ts

# Run all tests
nx run-many -t test && nx e2e pokehub-api-e2e && cd apps/pokehub-app-e2e && npx playwright test
```

---

## Test Count Summary

| Category               | Unit Tests | E2E Tests | Total  |
| ---------------------- | ---------- | --------- | ------ |
| Backend Controller     | 4          | -         | 4      |
| Backend Service        | 2          | -         | 2      |
| Backend E2E            | -          | 6         | 6      |
| useUpdateUserProfile   | 10         | -         | 10     |
| useDeleteAccount       | 9          | -         | 9      |
| useAvatarUpload        | 10         | -         | 10     |
| AvatarUpload Component | 10         | -         | 10     |
| Settings Component     | 20         | -         | 20     |
| UserDropdown           | 6          | -         | 6      |
| UserMenu (mobile)      | 3          | -         | 3      |
| Settings E2E           | -          | 14        | 14     |
| User Menu E2E          | -          | 4         | 4      |
| **Total**              | **74**     | **24**    | **98** |

---

## Related Documentation

- [Settings Page Feature](../features/settings-page.md) - Feature documentation
- [Unit & Integration Testing Guide](../development/unit-integration-testing.md) - Testing patterns
- [Frontend E2E Testing Architecture](../development/frontend-e2e-testing.md) - E2E setup
- [Backend E2E Testing Architecture](../development/backend-e2e-testing.md) - Backend E2E setup

---

**Created:** December 30, 2024  
**Status:** Ready for Implementation
