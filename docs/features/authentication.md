# Authentication & Profile Management Feature Documentation

## Overview

The Authentication & Profile Management feature provides secure user authentication via Google OAuth, JWT-based session management, and comprehensive profile creation with avatar uploads. The system uses NextAuth.js v5 on the frontend and NestJS with Passport.js on the backend.

**Status**: Complete and Production-Ready

## User Flow

```
Landing Page → Google Sign In → Profile Creation (if new) → Dashboard
                      ↓                    ↓
                OAuth Callback → Username & Avatar Upload
                      ↓
                JWT Token Storage → Session Management
```

## Architecture

### Authentication Routes

**Frontend Routes**:

- `/login` - Login page with Google OAuth button
- `/create-profile` - Profile creation for new users (username + avatar)
- `/api/auth/[...nextauth]` - NextAuth.js API route
- `/api/generate-upload-url` - Azure SAS URL generation for avatar uploads

**Backend Routes**:

- `GET /auth/oauth-login` - Google OAuth login/signup endpoint
- `GET /auth/access-token` - Refresh access token endpoint
- `GET /auth/load-user` - Load user data endpoint
- `POST /users/:userId/profile` - Update user profile endpoint
- `HEAD /users/:id?dataType=username` - Username availability check endpoint

### Component Structure

```
Frontend (Authentication):
├── shared-auth/
│   ├── auth.ts                          # NextAuth.js configuration
│   └── useAuthSession.tsx               # Custom session hook
├── pokehub-auth-forms/
│   └── login/
│       ├── login.form.tsx               # Google Sign In button
│       └── submit-form.tsx              # Form submission handler
├── shared-auth-provider/
│   └── auth.provider.tsx                # React Context auth provider
├── shared-app-router/
│   ├── client-route-guard.tsx           # Client-side route protection
│   └── server-route-guard.ts            # Server-side route protection
└── apps/pokehub-app/app/
    ├── login/page.tsx                   # Login page
    ├── create-profile/
    │   ├── profile.tsx                  # Profile creation form
    │   ├── profile.models.ts            # Zod validation schemas
    │   ├── useCreateProfile.tsx         # Profile creation hook
    │   └── useCheckUsername.ts          # Username availability hook
    └── api/
        ├── auth/[...nextauth]/route.ts  # NextAuth handler
        └── generate-upload-url/route.ts # Azure upload URL generator

Backend (Authentication):
├── auth/
│   ├── auth.controller.ts               # Auth endpoints
│   ├── auth.service.ts                  # Auth business logic
│   └── google-oauth.guard.ts            # Google OAuth verification
├── users/
│   ├── users.controller.ts              # User management endpoints
│   └── users.service.ts                 # User business logic
└── shared-auth-utils/
    ├── jwt.service.ts                   # JWT generation/validation
    ├── token-auth.guard.ts              # JWT auth guard
    ├── token-auth.decorator.ts          # Token type decorator
    ├── roles.guard.ts                   # Role-based access control
    ├── roles.decorator.ts               # Role definition decorator
    └── user.decorator.ts                # User data extraction
```

## Frontend Authentication

### 1. NextAuth.js Configuration

**Location**: `packages/frontend/shared-auth/src/lib/auth.ts`

**Provider**: Google OAuth (only authentication method)

**Key Features**:

- Custom JWT callback for token management
- Session callback for attaching user data
- Automatic token refresh mechanism
- Session update support

**JWT Callback Flow**:

1. **Initial Sign-In** (account present):

   ```typescript
   if (account) {
     // Call backend with Google ID token
     const response = await fetch('/api/auth/oauth-login', {
       headers: { Authorization: `Bearer ${account.id_token}` },
     });
   
     // Store backend tokens in JWT
     token.accessToken = response.accessToken;
     token.refreshToken = response.refreshToken;
     token.expiresAt = Date.now() + response.expiresIn * 1000;
     token.user = response.user;
   }
   ```

2. **Token Refresh** (expired):

   ```typescript
   if (Date.now() >= token.expiresAt) {
     // Refresh access token
     const response = await fetch('/api/auth/access-token', {
       headers: { Authorization: `Bearer ${token.refreshToken}` },
     });
   
     token.accessToken = response.accessToken;
     token.expiresAt = Date.now() + response.expiresIn * 1000;
   }
   ```

3. **Session Update**:
   ```typescript
   if (trigger === 'update' && session?.user) {
     token.user = { ...token.user, ...session.user };
   }
   ```

**Session Callback**:

```typescript
async session({ session, token }) {
  session.accessToken = token.accessToken;
  session.user = token.user;
  session.error = token.error;
  return session;
}
```

**Type Extensions**: `packages/frontend/global-next-types/src/lib/next-auth.d.ts`

```typescript
interface Session {
  error?: 'RefreshTokenError';
  user?: UserCore;
  accessToken?: string;
}

interface JWT {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: UserCore;
  error?: 'RefreshTokenError';
}
```

### 2. Login Flow

**Login Page**: `apps/pokehub-app/app/login/page.tsx`

**Server-Side Check**:

- Calls `handleServerAuth()` to check existing session
- Redirects authenticated users to dashboard
- Redirects users without username to `/create-profile`

**Login Form**: `packages/frontend/pokehub-auth-forms/src/lib/login/login.form.tsx`

**Features**:

- Material Design Google branding
- Single "Sign in with Google" button
- Uses NextAuth `signIn('google')` function

**Implementation**:

```tsx
<Button onClick={() => signIn('google')} className="w-full">
  <GoogleIcon />
  Sign in with Google
</Button>
```

### 3. Session Management

**Custom Hook**: `packages/frontend/shared-auth/src/lib/useAuthSession.tsx`

```typescript
export const useAuthSession = (): TypedSessionReturn => {
  const session = useSession();

  return {
    ...session,
    update: async (data: Partial<Session>) => await session.update(data),
  };
};
```

**Usage**:

- Get current session: `const { data: session, status } = useAuthSession()`
- Update session: `await update({ user: newUserData })`

**Session Provider**: `packages/frontend/shared-app-bootstrapper/src/lib/app-bootstrapper.tsx`

- Wraps entire app in NextAuth `<SessionProvider>`
- Enables session access throughout component tree

**Auth Context Provider**: `packages/frontend/shared-auth-provider/src/lib/auth.provider.tsx`

**Provides**:

- `isAuthenticated`: Boolean indicating auth status
- `isEmailVerified`: Email verification status
- `loading`: Loading state
- `accountRole`: User role (ADMIN | USER)

**Implementation**:

```tsx
export const AuthProvider = ({ children }: PropsWithChildren) => {
  const { data: session, status } = useAuthSession();

  const value = useMemo(
    () => ({
      isAuthenticated: !!session?.user,
      isEmailVerified: true, // Always true for Google OAuth
      loading: status === 'loading',
      accountRole: session?.user?.accountRole,
    }),
    [session, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### 4. Protected Routes & Guards

#### Client-Side Route Guard

**Location**: `packages/frontend/shared-app-router/src/lib/client-route-guard.tsx`

**Features**:

- Role-based access control (ADMIN, USER)
- Public route management with `isAuthAccessible` flag
- Protected route enforcement
- Automatic redirects based on auth state
- Profile completion flow
- Query parameter preservation (`?from=` for post-login redirects)

**Logic**:

1. **Unauthenticated user on private route** → Redirect to `/login?from=<current-path>`
2. **Authenticated user without username** → Redirect to `/create-profile`
3. **Authenticated user on public route with `isAuthAccessible: false`** → Redirect to `/dashboard`
4. **User without required role** → Redirect to `/dashboard`

**Implementation**:

```tsx
export const ClientRouteGuard = ({ children }: PropsWithChildren) => {
  const { isAuthenticated, accountRole } = useAuthContext();
  const { data: session, status } = useAuthSession();
  const pathname = usePathname();
  const router = useRouter();

  // Route validation logic...

  if (shouldRedirect) {
    router.push(redirectPath);
    return null;
  }

  return <>{children}</>;
};
```

#### Server-Side Route Guard

**Location**: `packages/frontend/shared-app-router/src/lib/server-route-guard.ts`

**Features**:

- Pre-render authentication checks
- Validates route access before page load
- Enforces username requirement for private routes
- Server-side redirects

**Usage**:

```typescript
export default async function Page() {
  await handleServerAuth();
  return <PageContent />;
}
```

#### Route Configuration

**Location**: `apps/pokehub-app/router.ts`

**Public Routes**:

```typescript
publicRoutes: [
  { route: '/', isAuthAccessible: false }, // Landing page
  { route: '/login', isAuthAccessible: false }, // Login page
  { route: '/pokedex', isAuthAccessible: true }, // Pokédex (public but auth can access)
];
```

**Privileged Routes**:

```typescript
privilegedRoutes: [
  {
    route: '/dashboard',
    rolesAllowed: ['ADMIN', 'USER'],
    allowSubRoutes: true,
  },
  {
    route: '/create-profile',
    rolesAllowed: ['USER'],
    allowSubRoutes: false,
  },
];
```

### 5. API Client with Token Retry

**Location**: `packages/frontend/pokehub-data-provider/src/lib/pokehub-api-client.ts`

**Auto-Retry on 401**:

```typescript
export const withAuthRetry = async <Data,>(
  accessToken: string,
  request: (accessToken: string) => Promise<FetchResponse<Data>>
): Promise<FetchResponse<Data>> => {
  try {
    return await request(accessToken);
  } catch (error) {
    if ((error as FetchApiError).status === 401) {
      // Token expired, get fresh session
      const session = await getAuthSession();

      if (!session?.accessToken) {
        throw new Error('No access token available');
      }

      // Retry request with new token
      return await request(session.accessToken);
    }
    throw error;
  }
};
```

**Usage**:

```typescript
const response = await withAuthRetry(accessToken, (token) =>
  apiClient.users.updateProfile(userId, data, {
    headers: { Authorization: `Bearer ${token}` },
  })
);
```

## Backend Authentication

### 1. JWT Token Management

**JWT Service**: `packages/backend/shared-auth-utils/src/lib/jwt.service.ts`

**Configuration**:

```typescript
secrets: {
  ACCESS_TOKEN: {
    value: process.env.ACCESS_TOKEN || 'access',
    expiryMinutes: process.env.ACCESS_TOKEN_EXPIRES || 60 // 1 hour
  },
  REFRESH_TOKEN: {
    value: process.env.REFRESH_TOKEN || 'refresh',
    expiryMinutes: process.env.REFRESH_TOKEN_EXPIRES || 720 // 12 hours
  }
}
```

**Key Methods**:

1. **Generate Tokens**:

   ```typescript
   generateAccessAndRefreshTokens(user: UserJwtData): Tokens {
     return {
       accessToken: this.generateToken(user, 'ACCESS_TOKEN'),
       refreshToken: this.generateToken(user, 'REFRESH_TOKEN'),
     };
   }
   
   generateToken(user: UserJwtData, tokenType: TokenType): string {
     const secret = this.secrets[tokenType];
     return jwt.sign(
       { ...user },
       secret.value,
       { expiresIn: `${secret.expiryMinutes}m` }
     );
   }
   ```

2. **Validate Token**:
   ```typescript
   validateToken(token: string, tokenType: TokenType): UserJwtData {
     try {
       const secret = this.secrets[tokenType];
       return jwt.verify(token, secret.value) as UserJwtData;
     } catch (error) {
       if (error instanceof jwt.TokenExpiredError) {
         throw new TokenExpiredError('Token has expired');
       }
       throw new JsonWebTokenError('Invalid token');
     }
   }
   ```

**JWT Payload** (`UserJwtData`):

```typescript
{
  id: string; // User ID
  email: string; // User email
  accountRole: 'ADMIN' | 'USER';
}
```

### 2. Guards & Decorators

#### Google OAuth Guard

**Location**: `apps/pokehub-api/src/auth/google-oauth.guard.ts`

**Purpose**: Validates Google ID token from OAuth flow

**Implementation**:

```typescript
@Injectable()
export class GoogleOAuthGuard implements CanActivate {
  private readonly oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract Google ID token from Authorization header
    const token = this.extractToken(request);

    // Verify with Google
    const ticket = await this.oauth2Client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    // Extract email from verified token
    const payload = ticket.getPayload();
    request.user = { email: payload.email };

    return true;
  }
}
```

#### Token Auth Guard

**Location**: `packages/backend/shared-auth-utils/src/lib/token-auth.guard.ts`

**Purpose**: Validates JWT access/refresh tokens

**Implementation**:

```typescript
@Injectable()
export class TokenAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get token type from decorator metadata
    const tokenType = this.reflector.get<TokenType>(
      TOKEN_AUTH_KEY,
      context.getHandler()
    );

    const request = context.switchToHttp().getRequest();

    // Extract Bearer token
    const token = this.extractToken(request);

    // Validate token
    const userData = this.jwtService.validateToken(token, tokenType);

    // Attach user data to request
    request.user = userData;

    return true;
  }
}
```

#### Roles Guard

**Location**: `packages/backend/shared-auth-utils/src/lib/roles.guard.ts`

**Purpose**: Role-based access control

**Implementation**:

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRole = this.reflector.get<UserAccountRole>(
      ROLES_KEY,
      context.getHandler()
    );

    if (!requiredRole) return true;

    const { user } = context.switchToHttp().getRequest();
    return user?.accountRole === requiredRole;
  }
}
```

#### Custom Decorators

**Token Type Decorator**: `packages/backend/shared-auth-utils/src/lib/token-auth.decorator.ts`

```typescript
export const TokenAuth = (tokenType: TokenType) =>
  SetMetadata(TOKEN_AUTH_KEY, tokenType);
```

**Roles Decorator**: `packages/backend/shared-auth-utils/src/lib/roles.decorator.ts`

```typescript
export const Roles = (role: UserAccountRole) => SetMetadata(ROLES_KEY, role);
```

**User Decorator**: `packages/backend/shared-auth-utils/src/lib/user.decorator.ts`

```typescript
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
```

**Usage Example**:

```typescript
@Get('access-token')
@UseGuards(TokenAuthGuard)
@TokenAuth('REFRESH_TOKEN')
async refreshAccessToken(@User() user: UserJwtData) {
  return await this.authService.refreshAccessToken(user);
}
```

### 3. Authentication Endpoints

**Auth Controller**: `apps/pokehub-api/src/auth/auth.controller.ts`

#### OAuth Login/Signup

**Route**: `GET /auth/oauth-login`

**Guard**: `GoogleOAuthGuard`

**Purpose**: Create or login user via Google OAuth

**Flow**:

```typescript
@Get('oauth-login')
@UseGuards(GoogleOAuthGuard)
async oauthLogin(@User() user: { email: string }): Promise<OAuthLoginResponse> {
  return await this.authService.createOrLoginUser(user.email);
}
```

**Response**:

```typescript
{
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  user: {
    id: string;
    email: string;
    username?: string;
    accountRole: 'ADMIN' | 'USER';
    accountType: 'GOOGLE';
    avatarUrl?: string;
  };
}
```

#### Refresh Access Token

**Route**: `GET /auth/access-token`

**Guard**: `TokenAuthGuard` with `REFRESH_TOKEN`

**Purpose**: Generate new access token

**Flow**:

```typescript
@Get('access-token')
@UseGuards(TokenAuthGuard)
@TokenAuth('REFRESH_TOKEN')
async refreshAccessToken(@User() user: UserJwtData): Promise<AccessToken> {
  return await this.authService.refreshAccessToken(user);
}
```

**Response**:

```typescript
{
  accessToken: string;
  expiresIn: number; // seconds
}
```

#### Load User Data

**Route**: `GET /auth/load-user`

**Guard**: `TokenAuthGuard` with `ACCESS_TOKEN`

**Purpose**: Load user profile data

**Flow**:

```typescript
@Get('load-user')
@UseGuards(TokenAuthGuard)
@TokenAuth('ACCESS_TOKEN')
async loadUser(@User() user: UserJwtData): Promise<UserCore> {
  return await this.authService.loadUser(user.id);
}
```

### 4. Auth Service

**Location**: `apps/pokehub-api/src/auth/auth.service.ts`

**Key Methods**:

1. **Create or Login User**:

   ```typescript
   async createOrLoginUser(email: string): Promise<OAuthLoginResponse> {
     // Check if user exists
     let user = await this.usersDbService.findUserByEmail(email);
   
     // Create new user if not found
     if (!user) {
       user = await this.usersDbService.createUser({
         email,
         accountType: 'GOOGLE',
         accountRole: 'USER',
       });
     }
   
     // Generate tokens
     const { accessToken, refreshToken } =
       this.jwtService.generateAccessAndRefreshTokens({
         id: user.id,
         email: user.email,
         accountRole: user.accountRole,
       });
   
     return {
       accessToken,
       refreshToken,
       expiresIn: 3600, // 1 hour
       user: this.mapUserToCore(user),
     };
   }
   ```

2. **Refresh Access Token**:

   ```typescript
   async refreshAccessToken(user: UserJwtData): Promise<AccessToken> {
     const accessToken = this.jwtService.generateToken(user, 'ACCESS_TOKEN');
   
     return {
       accessToken,
       expiresIn: 3600,
     };
   }
   ```

## Profile Management

### 1. Profile Creation Flow

**Page**: `apps/pokehub-app/app/create-profile/profile.tsx`

**Features**:

- Username input with real-time validation
- Username availability checking (debounced 500ms)
- Avatar file upload with preview
- Form validation using React Hook Form + Zod
- Visual feedback for username status

**Validation Schema**: `apps/pokehub-app/app/create-profile/profile.models.ts`

```typescript
export const profileSchema = z.object({
  username: z
    .string()
    .min(5, 'Username must be at least 5 characters')
    .max(15, 'Username must be less than 15 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  avatar: z.string().optional(),
});
```

**Component Structure**:

```tsx
<Form>
  {/* Username Input */}
  <FormField
    name="username"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Username</FormLabel>
        <FormControl>
          <Input
            {...field}
            onChange={(e) => {
              field.onChange(e);
              debouncedCheckUsername(e.target.value);
            }}
          />
        </FormControl>
        {isCheckingUsername && <span>Checking...</span>}
        {usernameAvailable && <span>✓ Available</span>}
        {usernameTaken && <span>✗ Taken</span>}
      </FormItem>
    )}
  />

  {/* Avatar Upload */}
  <FormField
    name="avatar"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Avatar</FormLabel>
        <FormControl>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              setAvatarFile(file);
              field.onChange(file?.name);
            }}
          />
        </FormControl>
        {avatarPreview && <img src={avatarPreview} alt="Preview" />}
      </FormItem>
    )}
  />

  <Button type="submit">Create Profile</Button>
</Form>
```

### 2. Username Availability Check

**Hook**: `apps/pokehub-app/app/create-profile/useCheckUsername.ts`

**Implementation**:

```typescript
export const useCheckUsername = (username: string) => {
  return useQuery({
    queryKey: [
      'users',
      username,
      {
        queryType: 'availability',
        dataType: 'username',
      },
    ],
    queryFn: async () => {
      // Makes HEAD request to check existence
      const response = await fetch(`/api/users/${username}?dataType=username`, {
        method: 'HEAD',
      });

      // 404 = available, 200 = taken
      return response.status === 404;
    },
    enabled: !!username && username.length >= 5,
    retry: false,
    staleTime: 0, // Always check freshness
  });
};
```

**Backend Endpoint**: `apps/pokehub-api/src/users/users.controller.ts`

```typescript
@Head(':id')
@UseGuards(TokenAuthGuard)
@TokenAuth('ACCESS_TOKEN')
async checkUserExists(
  @Param('id') id: string,
  @Query('dataType') dataType?: 'username' | 'id'
): Promise<void> {
  const user = dataType === 'username'
    ? await this.usersDbService.findUserByUsername(id)
    : await this.usersDbService.findUserById(id);

  if (!user) {
    throw new NotFoundException('User not found');
  }

  // Return 200 if exists
}
```

**Debounced Usage**:

```typescript
const [debouncedUsername, setDebouncedUsername] = useState('');

const debouncedCheckUsername = useMemo(
  () =>
    debounce((value: string) => {
      setDebouncedUsername(value);
    }, 500),
  []
);

const { data: isAvailable, isLoading } = useCheckUsername(debouncedUsername);
```

### 3. Avatar Upload to Azure Blob Storage

**Upload Flow**:

#### Step 1: Generate SAS URL

**Endpoint**: `POST /api/generate-upload-url`

**Location**: `apps/pokehub-app/app/api/generate-upload-url/route.ts`

**Request**:

```typescript
POST / api / generate - upload - url;
Headers: {
  Cookie: 'next-auth.session-token=...';
}
Body: {
  fileName: string;
  fileType: string;
}
```

**Implementation**:

```typescript
export async function POST(request: NextRequest) {
  // Validate session
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { fileName, fileType } = await request.json();

  // Create blob service client
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );

  // Get container client
  const containerClient = blobServiceClient.getContainerClient('avatars');

  // Generate blob name: {userId}/avatar.{ext}
  const blobName = `${session.user.id}/${fileName}`;
  const blobClient = containerClient.getBlobClient(blobName);

  // Generate SAS token (1 hour expiry, write permissions)
  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: 'avatars',
      blobName,
      permissions: BlobSASPermissions.parse('w'), // Write only
      startsOn: new Date(),
      expiresOn: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
    sharedKeyCredential
  ).toString();

  return NextResponse.json({
    uploadUrl: `${blobClient.url}?${sasToken}`,
    blobUrl: blobClient.url, // Without SAS, for storage
  });
}
```

**Response**:

```typescript
{
  uploadUrl: string; // URL with SAS token for upload
  blobUrl: string; // Final URL without SAS
}
```

#### Step 2: Upload to Azure

**Frontend Implementation**:

```typescript
// Generate upload URL
const { uploadUrl } = await fetch('/api/generate-upload-url', {
  method: 'POST',
  body: JSON.stringify({
    fileName: avatarFile.name,
    fileType: avatarFile.type,
  }),
}).then((res) => res.json());

// Upload file directly to Azure
await fetch(uploadUrl, {
  method: 'PUT',
  headers: {
    'x-ms-blob-type': 'BlockBlob',
    'Content-Type': avatarFile.type,
  },
  body: avatarFile,
});
```

#### Step 3: Save Profile Data

**Hook**: `apps/pokehub-app/app/create-profile/useCreateProfile.tsx`

**Implementation**:

```typescript
export const useCreateProfile = () => {
  const { update } = useAuthSession();

  return useMutation({
    mutationFn: async ({
      username,
      avatarFile,
    }: {
      username: string;
      avatarFile?: File;
    }) => {
      let avatarFileName: string | undefined;

      // Upload avatar if provided
      if (avatarFile) {
        const { uploadUrl } = await generateUploadUrl({
          fileName: avatarFile.name,
          fileType: avatarFile.type,
        });

        await uploadToAzure(uploadUrl, avatarFile);
        avatarFileName = avatarFile.name;
      }

      // Save profile to backend
      const response = await apiClient.users.updateProfile(session.user.id, {
        username,
        avatar: avatarFileName,
      });

      // Update NextAuth session
      await update({
        user: response.user,
      });

      return response;
    },
  });
};
```

### 4. Profile Update Backend

**Endpoint**: `POST /users/:userId/profile`

**Controller**: `apps/pokehub-api/src/users/users.controller.ts`

```typescript
@Post(':userId/profile')
@UseGuards(TokenAuthGuard)
@TokenAuth('ACCESS_TOKEN')
async updateUserProfile(
  @Param('userId') userId: string,
  @Body() updateUserProfileDto: UpdateUserProfileDTO,
  @User() user: UserJwtData
): Promise<UpdateUserProfileResponse> {
  // Ensure user can only update their own profile
  if (user.id !== userId) {
    throw new ForbiddenException('Cannot update another user\'s profile');
  }

  return await this.usersService.updateUserProfile(userId, updateUserProfileDto);
}
```

**Service**: `apps/pokehub-api/src/users/users.service.ts`

```typescript
async updateUserProfile(
  userId: string,
  data: IUpdateUserProfile
): Promise<UpdateUserProfileResponse> {
  // Extract file extension from avatar filename
  const avatarFilename = data.avatar
    ? `avatar.${data.avatar.split('.').pop()}`
    : undefined;

  // Update database
  const updatedUser = await this.usersDbService.updateUserProfile(userId, {
    username: data.username,
    avatarFilename,
  });

  // Return with full avatar URL
  return {
    user: {
      ...this.mapUserToCore(updatedUser),
      avatarUrl: avatarFilename
        ? this.getAvatarUrl(userId, avatarFilename)
        : undefined,
    },
  };
}

private getAvatarUrl(userId: string, avatarFilename: string): string {
  const { storageAccount } = azureConfig;
  return `https://${storageAccount.name}.blob.core.windows.net/${storageAccount.avatarContainerName}/${userId}/${avatarFilename}`;
}
```

**Database Service**: `packages/backend/pokehub-users-db/src/lib/users-db.service.ts`

```typescript
async updateUserProfile(
  userId: string,
  data: { username: string; avatarFilename?: string }
) {
  const [updatedUser] = await this.dbService
    .update(usersTable)
    .set({
      username: data.username,
      avatarFilename: data.avatarFilename,
    })
    .where(eq(usersTable.id, userId))
    .returning();

  return updatedUser;
}
```

## Database Schema

**Users Table**: `packages/backend/pokehub-users-db/src/lib/schema/user.schema.ts`

```typescript
export const usersTable = pgTable(USERS_TABLE, {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').unique(),
  email: text('email').notNull().unique(),
  accountRole: accountRoleEnum('accountRole').notNull().default('USER'),
  accountType: accountTypeEnum('accountType').notNull(),
  avatarFilename: text('avatarFilename'),
});

export const accountRoleEnum = pgEnum('accountRole', ['ADMIN', 'USER']);
export const accountTypeEnum = pgEnum('accountType', ['GOOGLE']);
```

**Fields**:

- `id` - UUID primary key (auto-generated)
- `username` - Unique username (nullable, set during profile creation)
- `email` - Unique email from OAuth (not null)
- `accountRole` - User role (default: 'USER')
- `accountType` - OAuth provider (currently only 'GOOGLE')
- `avatarFilename` - Avatar filename stored in Azure (e.g., "avatar.png")

**Avatar URL Construction**:

```
https://{storageAccount}.blob.core.windows.net/avatars/{userId}/{avatarFilename}
```

## Security Features

### 1. Token Security

- **Separate Secrets**: Access and refresh tokens use different secrets
- **Short-Lived Access Tokens**: 1 hour expiry by default
- **Refresh Token Rotation**: Refresh tokens expire after 12 hours
- **Token Validation**: Signature and expiry validation on every request
- **Secure Storage**: Tokens stored in httpOnly cookies (NextAuth session)

### 2. OAuth Security

- **Google ID Token Verification**: Backend verifies token with Google OAuth2Client
- **Audience Validation**: Ensures token was issued for this app
- **No Password Storage**: Passwordless authentication via OAuth only
- **Email Verification**: Google OAuth ensures email ownership

### 3. Azure Blob Security

- **SAS Tokens**: Time-limited upload URLs (1 hour expiry)
- **Write-Only Permissions**: SAS tokens only allow write operations
- **User-Scoped Storage**: Avatars stored in user-specific folders (`{userId}/avatar.*`)
- **File Type Validation**: Frontend validates file types before upload
- **Connection String Security**: Azure credentials in environment variables

### 4. Route Protection

- **Server-Side Guards**: Pre-render authentication checks
- **Client-Side Guards**: Real-time route protection
- **Role-Based Access**: Different routes for ADMIN vs USER
- **Profile Completion Check**: Enforces username before accessing private routes
- **CSRF Protection**: NextAuth handles CSRF tokens automatically

### 5. API Security

- **JWT Guards**: All protected endpoints require valid tokens
- **User Isolation**: Users can only access their own data
- **Input Validation**: DTOs validate all request data
- **Error Handling**: Generic error messages to prevent info leakage

## Data Flow

### Complete Authentication Flow

```
1. User clicks "Sign in with Google"
   ↓
2. NextAuth redirects to Google OAuth
   ↓
3. User authorizes app on Google
   ↓
4. Google redirects back with ID token
   ↓
5. NextAuth JWT callback receives account data
   ↓
6. Frontend calls backend: GET /auth/oauth-login
   Headers: { Authorization: Bearer {googleIdToken} }
   ↓
7. GoogleOAuthGuard validates Google ID token
   ↓
8. AuthService creates or fetches user by email
   ↓
9. JwtService generates access + refresh tokens
   ↓
10. Backend returns: { accessToken, refreshToken, expiresIn, user }
   ↓
11. NextAuth stores tokens in JWT
   ↓
12. Session callback attaches user data to session
   ↓
13. Client-side route guard checks profile completion
   ↓
14. If no username: Redirect to /create-profile
    If has username: Redirect to /dashboard
```

### Profile Creation Flow

```
1. User enters username
   ↓
2. Debounced hook triggers after 500ms
   ↓
3. Frontend: HEAD /users/{username}?dataType=username
   ↓
4. Backend checks database for username
   ↓
5. Returns 404 (available) or 200 (taken)
   ↓
6. User selects avatar file
   ↓
7. Frontend: POST /api/generate-upload-url
   ↓
8. Validate NextAuth session
   ↓
9. Generate Azure SAS token (1 hour, write-only)
   ↓
10. Return uploadUrl and blobUrl
   ↓
11. Frontend uploads file directly to Azure
   ↓
12. Frontend: POST /users/{userId}/profile
    Body: { username, avatar: "avatar.png" }
   ↓
13. Backend updates database
   ↓
14. Backend returns user data with avatarUrl
   ↓
15. Frontend updates NextAuth session
   ↓
16. Route guard redirects to /dashboard
```

### Token Refresh Flow

```
1. User makes authenticated request
   ↓
2. Frontend includes access token in header
   ↓
3. Backend TokenAuthGuard validates token
   ↓
4. If expired: Guard throws 401 Unauthorized
   ↓
5. Frontend API client catches 401
   ↓
6. NextAuth JWT callback detects expired token
   ↓
7. Frontend: GET /auth/access-token
   Headers: { Authorization: Bearer {refreshToken} }
   ↓
8. Backend validates refresh token
   ↓
9. Backend generates new access token
   ↓
10. NextAuth updates JWT with new token
   ↓
11. Frontend retries original request with new token
   ↓
12. Request succeeds
```

## Configuration

### Environment Variables

**Frontend** (`.env.local`):

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:4200
NEXTAUTH_SECRET=your-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3000

# Azure Storage
AZURE_STORAGE_ACCOUNT_NAME=pokehub
AZURE_STORAGE_ACCOUNT_KEY=your-azure-key
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;...
```

**Backend** (`.env`):

```bash
# JWT Secrets
ACCESS_TOKEN=your-access-token-secret
REFRESH_TOKEN=your-refresh-token-secret
ACCESS_TOKEN_EXPIRES=60          # minutes
REFRESH_TOKEN_EXPIRES=720        # minutes (12 hours)

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pokehub

# Azure Storage
AZURE_STORAGE_ACCOUNT_NAME=pokehub
AZURE_STORAGE_CONTAINER=avatars
```

### Azure Configuration

**Storage Account**:

- Name: From `AZURE_STORAGE_ACCOUNT_NAME` env var
- Container: `avatars` (must be created manually)
- Access Level: Private (access via SAS tokens only)

**Blob Structure**:

```
avatars/
├── {userId-1}/
│   └── avatar.png
├── {userId-2}/
│   └── avatar.jpg
└── {userId-3}/
    └── avatar.webp
```

## Dependencies

### NPM Packages

**Frontend**:

- `next-auth` - NextAuth.js v5 for authentication
- `@azure/storage-blob` - Azure Blob Storage SDK
- `@tanstack/react-query` - Data fetching and caching
- `react-hook-form` - Form state management
- `zod` - Schema validation
- `next` - Next.js framework

**Backend**:

- `@nestjs/passport` - Passport.js integration
- `passport` - Authentication middleware
- `jsonwebtoken` - JWT generation/validation
- `google-auth-library` - Google OAuth verification
- `@nestjs/jwt` - NestJS JWT module
- `drizzle-orm` - Database ORM

### Internal Packages

**Frontend**:

- `@pokehub/frontend/shared-auth` - NextAuth configuration
- `@pokehub/frontend/shared-auth-provider` - Auth context provider
- `@pokehub/frontend/pokehub-auth-forms` - Login form components
- `@pokehub/frontend/shared-app-router` - Route guards
- `@pokehub/frontend/pokehub-data-provider` - API client
- `@pokehub/frontend/global-next-types` - TypeScript type extensions

**Backend**:

- `@pokehub/backend/shared-auth-utils` - JWT service, guards, decorators
- `@pokehub/backend/pokehub-users-db` - User database operations
- `@pokehub/backend/pokehub-postgres` - Database connection

**Shared**:

- `@pokehub/shared/shared-auth-models` - Auth request/response types
- `@pokehub/shared/shared-user-models` - User data models

## File Locations

```
Frontend:
apps/pokehub-app/
├── app/
│   ├── login/
│   │   └── page.tsx                        # Login page
│   ├── create-profile/
│   │   ├── profile.tsx                     # Profile creation form
│   │   ├── profile.models.ts               # Validation schemas
│   │   ├── useCreateProfile.tsx            # Profile creation hook
│   │   └── useCheckUsername.ts             # Username check hook
│   └── api/
│       ├── auth/[...nextauth]/route.ts     # NextAuth handler
│       └── generate-upload-url/route.ts    # Azure SAS generator
└── router.ts                               # Route configuration

packages/frontend/
├── shared-auth/
│   ├── auth.ts                             # NextAuth config
│   └── useAuthSession.tsx                  # Session hook
├── pokehub-auth-forms/
│   └── login/
│       ├── login.form.tsx                  # Google Sign In button
│       └── submit-form.tsx                 # Form handler
├── shared-auth-provider/
│   └── auth.provider.tsx                   # Auth context
├── shared-app-router/
│   ├── client-route-guard.tsx              # Client guard
│   └── server-route-guard.ts               # Server guard
├── pokehub-data-provider/
│   └── pokehub-api-client.ts               # API client with retry
└── global-next-types/
    └── next-auth.d.ts                      # Type extensions

Backend:
apps/pokehub-api/src/
├── auth/
│   ├── auth.controller.ts                  # Auth endpoints
│   ├── auth.service.ts                     # Auth logic
│   └── google-oauth.guard.ts               # Google OAuth guard
├── users/
│   ├── users.controller.ts                 # User endpoints
│   └── users.service.ts                    # User logic
└── config/
    └── configuration.ts                    # App config

packages/backend/
├── shared-auth-utils/
│   ├── jwt.service.ts                      # JWT service
│   ├── token-auth.guard.ts                 # Token guard
│   ├── token-auth.decorator.ts             # Token decorator
│   ├── roles.guard.ts                      # Roles guard
│   ├── roles.decorator.ts                  # Roles decorator
│   └── user.decorator.ts                   # User decorator
├── pokehub-users-db/
│   ├── users-db.service.ts                 # Database operations
│   └── schema/
│       └── user.schema.ts                  # User table schema
└── pokehub-postgres/
    └── postgres.service.ts                 # Database connection

Shared:
packages/shared/
├── shared-auth-models/
│   ├── tokens.model.ts                     # Token interfaces
│   └── tokens.type.ts                      # Token types
└── shared-user-models/
    ├── user-data.model.ts                  # User interfaces
    ├── oauth-response.model.ts             # OAuth response
    └── update-user-profile.model.ts        # Profile update
```

## Known Limitations

1. **Single OAuth Provider**: Only Google OAuth is supported (no GitHub, Facebook, etc.)
2. **Avatar File Size**: No explicit file size limit validation on frontend
3. **Avatar File Types**: Limited client-side validation for image types
4. **No Email Verification Flow**: Relies on Google OAuth email verification
5. **No Password Reset**: Not applicable (OAuth only), but no fallback auth method
6. **Username Cannot Be Changed**: Once set, username is immutable
7. **No Avatar Deletion**: Old avatars not automatically cleaned up when replaced
8. **No Multi-Factor Authentication**: MFA not implemented
9. **Account Deletion**: Self-service account deletion available via Settings page (see [Settings Page](./settings-page.md))
10. **Token Storage**: Tokens stored in NextAuth session (not in localStorage for XSS protection)

## Future Enhancements

### Planned Features

1. **Additional OAuth Providers**:

   - GitHub OAuth
   - Discord OAuth
   - Twitter/X OAuth

2. **Enhanced Profile Management**:

   - Username change (with validation/cooldown)
   - Email change with verification
   - ~~Account deletion flow~~ ✅ Implemented (see [Settings Page](./settings-page.md))
   - Profile privacy settings

3. **Avatar Improvements**:

   - Avatar cropping tool
   - Default avatar generator (identicons)
   - Avatar size limits (client + server validation)
   - Multiple avatar uploads (profile picture history)
   - Avatar compression before upload

4. **Security Enhancements**:

   - Multi-factor authentication (TOTP/SMS)
   - Login history tracking
   - Active session management
   - Suspicious activity detection
   - Device fingerprinting

5. **User Preferences**:

   - Theme preferences (dark/light mode)
   - Notification settings
   - Privacy settings
   - Language preferences

6. **Admin Features**:

   - User management dashboard
   - Role assignment UI
   - User activity logs
   - Account suspension/ban

7. **Social Features**:
   - User profiles (public/private)
   - Follow/friend system
   - User search

### Potential Improvements

- **Token Refresh Strategy**: Implement sliding session with automatic refresh
- **Passwordless Email Auth**: Magic link authentication
- **SSO Integration**: Enterprise SSO support
- **Rate Limiting**: Prevent brute force on username checking
- **Audit Logging**: Track all authentication events
- **Account Recovery**: Email-based account recovery flow
- **Session Management UI**: View and revoke active sessions
- **Progressive Web App**: Offline authentication support

## Testing Checklist

### Critical Paths

- [ ] Google OAuth login creates new user successfully
- [ ] Google OAuth login returns existing user
- [ ] Access token refresh works when token expires
- [ ] Protected routes redirect unauthenticated users to login
- [ ] Users without username redirected to profile creation
- [ ] Username availability check works correctly
- [ ] Avatar upload to Azure succeeds
- [ ] Profile creation updates NextAuth session
- [ ] Role-based access control works for different routes
- [ ] Logout clears session properly

### Edge Cases

- [ ] Expired access token auto-refreshes
- [ ] Expired refresh token forces re-login
- [ ] Duplicate username attempt shows error
- [ ] Invalid image file type rejected
- [ ] Very large avatar file handled gracefully
- [ ] Azure SAS token expiry handled
- [ ] Network failure during avatar upload
- [ ] Concurrent username checks (debounced correctly)
- [ ] Invalid JWT signature rejected
- [ ] Missing Authorization header handled
- [ ] Google OAuth token verification failure
- [ ] Database connection failure during login

### Security Tests

- [ ] Cannot access protected routes without token
- [ ] Cannot use expired access token
- [ ] Cannot use refresh token for protected routes
- [ ] Cannot update another user's profile
- [ ] SAS token limited to write-only permissions
- [ ] Invalid Google OAuth token rejected
- [ ] CSRF protection active on auth endpoints
- [ ] XSS protection in username input

## Changelog

### Initial Release

- ✅ Google OAuth authentication
- ✅ JWT access and refresh token system
- ✅ Automatic token refresh mechanism
- ✅ Protected routes with role-based access control
- ✅ Server and client-side route guards
- ✅ Profile creation with username validation
- ✅ Real-time username availability checking
- ✅ Avatar upload to Azure Blob Storage
- ✅ SAS token generation for secure uploads
- ✅ User database schema with Drizzle ORM
- ✅ TypeScript type safety throughout
- ✅ NextAuth.js session management
- ✅ Error handling and retry logic
