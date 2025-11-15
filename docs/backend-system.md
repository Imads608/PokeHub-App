# Backend System Documentation

## Overview

The PokeHub backend is built with **NestJS**, a progressive Node.js framework for building efficient, scalable server-side applications. The backend provides RESTful APIs for authentication, user management, and team building functionality, with PostgreSQL database integration via Drizzle ORM.

**Tech Stack**:
- **Framework**: NestJS (Node.js + TypeScript)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM (type-safe, lightweight)
- **Authentication**: JWT tokens with Google OAuth verification
- **Logging**: Winston (structured logging)
- **Storage**: Azure Blob Storage (for avatars)
- **Validation**: class-validator + class-transformer

**API Base URL**: `http://localhost:3000/api`

---

## Architecture

### High-Level Structure

```
apps/pokehub-api/
├── src/
│   ├── app/                    # Application module & global config
│   ├── auth/                   # Authentication module
│   ├── users/                  # User management module
│   ├── common/                 # Common utilities & middleware
│   ├── config/                 # Configuration management
│   └── main.ts                 # Application entry point

packages/backend/
├── pokehub-postgres/          # Database connection & Drizzle setup
├── pokehub-users-db/          # User database operations
├── shared-auth-utils/         # JWT services, guards, decorators
├── shared-exceptions/         # Custom exception handling
└── shared-logger/             # Winston logging service
```

### Design Principles

1. **Modular Architecture**: Features organized into self-contained modules (Auth, Users)
2. **Dependency Injection**: NestJS DI container manages all dependencies
3. **Separation of Concerns**: Controllers → Services → Database layers
4. **Type Safety**: Full TypeScript coverage with Drizzle ORM type inference
5. **Shared Packages**: Reusable backend utilities in monorepo packages
6. **Interface-Based Design**: Services implement interfaces for testability

---

## Application Bootstrap

### Entry Point (`main.ts`)

**Location**: `apps/pokehub-api/src/main.ts`

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Custom Winston logger
  app.useLogger(await app.resolve(AppLogger));

  // Enable CORS for frontend
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  // Start server
  const port = process.env.PORT || 3000;
  await app.listen(port);
}
```

**Key Features**:
- **Global Prefix**: All routes prefixed with `/api`
- **Custom Logger**: Winston-based AppLogger replaces default NestJS logger
- **CORS Enabled**: Allows frontend (localhost:4200) to access API
- **Auto-Validation**: DTOs validated automatically via ValidationPipe

---

## Module Organization

### App Module (`app.module.ts`)

**Location**: `apps/pokehub-api/src/app/app.module.ts`

The root module that orchestrates all feature modules.

```typescript
@Module({
  imports: [
    CommonModule,           // Shared utilities
    AuthModule,             // Authentication
    UsersModule,            // User management
    RouterModule.register(routes),  // Route prefixes
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      load: [configuration],
    }),
  ],
  providers: [
    { provide: APP_FILTER, useClass: CatchEverythingFilter }
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceMiddleware).forRoutes('*');
  }
}
```

**Key Components**:
- **Global Exception Filter**: `CatchEverythingFilter` handles all unhandled exceptions
- **Trace Middleware**: Adds request tracing with unique trace IDs
- **Global Config**: Environment variables loaded via `ConfigModule`
- **Route Modules**: Auth and Users modules with route prefixes

### Routing Configuration (`app.routes.ts`)

**Location**: `apps/pokehub-api/src/app/app.routes.ts`

```typescript
export const routes: Routes = [
  { path: '/auth', module: AuthModule },
  { path: '/users', module: UsersModule },
];
```

**Route Structure**:
- `/api/auth/*` → AuthModule
- `/api/users/*` → UsersModule

---

## Feature Modules

### 1. Authentication Module

**Location**: `apps/pokehub-api/src/auth/`

**Purpose**: Handle user authentication via Google OAuth and JWT token management

**Structure**:
```
auth/
├── auth.module.ts              # Module definition
├── auth.controller.ts          # API endpoints
├── auth.service.ts             # Business logic
├── auth.service.interface.ts   # Service contract
└── google-oauth.guard.ts       # Google OAuth verification guard
```

**Endpoints**:

| Method | Route | Guard | Purpose |
|--------|-------|-------|---------|
| GET | `/api/auth/oauth-login` | GoogleOAuthGuard | Login/signup via Google OAuth |
| GET | `/api/auth/access-token` | TokenAuthGuard (REFRESH) | Refresh access token |
| GET | `/api/auth/load-user` | TokenAuthGuard (ACCESS) | Load user profile |

**Key Features**:
- Google ID token verification
- JWT access + refresh token generation
- User creation on first login
- Token refresh mechanism

**Dependencies**:
- `@pokehub/backend/shared-auth-utils` - JWT service, guards
- `@pokehub/backend/pokehub-users-db` - User database operations
- `google-auth-library` - Google OAuth verification

### 2. Users Module

**Location**: `apps/pokehub-api/src/users/`

**Purpose**: User profile management and queries

**Structure**:
```
users/
├── users.module.ts             # Module definition
├── users.controller.ts         # API endpoints
├── users.service.ts            # Business logic
├── users.service.interface.ts  # Service contract
└── users.service.provider.ts   # DI provider configuration
```

**Endpoints**:

| Method | Route | Guard | Purpose |
|--------|-------|-------|---------|
| POST | `/api/users/:userId/profile` | TokenAuthGuard (ACCESS) | Update user profile |
| HEAD | `/api/users/:id` | TokenAuthGuard (ACCESS) | Check username/user existence |

**Key Features**:
- Profile creation (username + avatar)
- Username availability checking
- Avatar URL construction (Azure Blob)
- User authorization (can only update own profile)

**Dependencies**:
- `@pokehub/backend/pokehub-users-db` - Database operations
- `@pokehub/backend/shared-auth-utils` - Auth guards

### 3. Common Module

**Location**: `apps/pokehub-api/src/common/`

**Purpose**: Shared utilities and middleware

**Components**:
- **TraceMiddleware**: Request tracing with unique IDs

---

## Database Architecture

### PostgreSQL with Drizzle ORM

**Why Drizzle?**
- Type-safe queries with full TypeScript inference
- Lightweight (no runtime overhead)
- SQL-like syntax (easy to learn)
- Great performance

### Database Connection

**Package**: `@pokehub/backend/pokehub-postgres`

**Location**: `packages/backend/pokehub-postgres/src/lib/postgres.service.ts`

```typescript
export const postgresProvider = {
  provide: POSTGRES_SERVICE,
  useFactory: async (logger: AppLogger, configService: ConfigService) => {
    const dbCreds = configService.get('db', { infer: true });
    const connString = `postgress://${dbCreds.user}:${dbCreds.password}@${dbCreds.host}:${dbCreds.port}/${dbCreds.name}`;
    const db = drizzle(connString);

    // Test connection
    await db.execute(sql`SELECT 1 as connected`);
    logger.log(`Successfully connected to DB: ${connString}`);

    return db;
  },
  inject: [AppLogger, ConfigService],
};

export type PostgresService = Awaited<ReturnType<typeof postgresProvider.useFactory>>;
```

**Features**:
- Connection tested on startup
- Credentials from environment variables
- Injected as `POSTGRES_SERVICE` provider
- Type-safe via TypeScript type inference

### Database Schema

**Package**: `@pokehub/backend/pokehub-users-db`

**Location**: `packages/backend/pokehub-users-db/src/lib/schema/user.schema.ts`

#### Users Table

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

export type User = typeof usersTable.$inferSelect;
```

**Schema Details**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, AUTO | User unique identifier |
| `username` | TEXT | UNIQUE, NULLABLE | Username (set during profile creation) |
| `email` | TEXT | UNIQUE, NOT NULL | Email from OAuth |
| `accountRole` | ENUM | NOT NULL, DEFAULT 'USER' | User role (ADMIN or USER) |
| `accountType` | ENUM | NOT NULL | OAuth provider (currently only GOOGLE) |
| `avatarFilename` | TEXT | NULLABLE | Avatar filename in Azure Blob |

**Enums**:
- `accountRole`: `'ADMIN' | 'USER'`
- `accountType`: `'GOOGLE'` (future: GitHub, Discord, etc.)

**Avatar URL Construction**:
```typescript
const avatarUrl = `https://${storageAccount}.blob.core.windows.net/avatars/${userId}/${avatarFilename}`;
```

### Database Operations Service

**Package**: `@pokehub/backend/pokehub-users-db`

**Location**: `packages/backend/pokehub-users-db/src/lib/users-db.service.ts`

**Interface** (`users-db-service.interface.ts`):
```typescript
export interface IUsersDBService {
  createUser(email: string, accountType: User['accountType']): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUserProfile(
    userId: string,
    data: Omit<IUpdateUserProfile, 'avatar'> & { avatarFilename: string }
  ): Promise<User>;
}
```

**Key Methods**:

1. **Create User**:
```typescript
async createUser(email: string, accountType: User['accountType']) {
  const user: typeof usersTable.$inferInsert = { email, accountType };
  const res = await this.dbService
    .insert(usersTable)
    .values(user)
    .returning();

  if (res.length === 0) {
    throw new ServiceError('ServiceError', 'Unable to create user');
  }

  return res[0];
}
```

2. **Get User by Email**:
```typescript
async getUserByEmail(email: string) {
  const res = await this.dbService
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .execute();

  return res.length === 0 ? undefined : res[0];
}
```

3. **Update User Profile**:
```typescript
async updateUserProfile(userId: string, data: { username: string; avatarFilename: string }) {
  const res = await this.dbService
    .update(usersTable)
    .set({ username: data.username, avatarFilename: data.avatarFilename })
    .where(eq(usersTable.id, userId))
    .returning();

  if (res.length === 0) {
    throw new ServiceError('ServiceError', 'Unable to update user profile');
  }

  return res[0];
}
```

**Error Handling**:
- Throws `ServiceError` on database failures
- Returns `undefined` for not-found queries
- Uses `.returning()` to get updated/inserted rows

---

## Shared Backend Packages

### 1. Shared Auth Utils

**Package**: `@pokehub/backend/shared-auth-utils`

**Location**: `packages/backend/shared-auth-utils/`

Provides authentication utilities: JWT service, guards, and decorators.

#### JWT Service

**Location**: `src/lib/jwt.service.ts`

```typescript
@Injectable()
export class JwtService implements IJwtService {
  private secrets = {
    ACCESS_TOKEN: {
      value: process.env.ACCESS_TOKEN || 'access',
      expiryMinutes: 60
    },
    REFRESH_TOKEN: {
      value: process.env.REFRESH_TOKEN || 'refresh',
      expiryMinutes: 720  // 12 hours
    }
  };

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
}
```

**JWT Payload** (`UserJwtData`):
```typescript
{
  id: string;
  email: string;
  accountRole: 'ADMIN' | 'USER';
}
```

**Token Lifetimes**:
- Access Token: 60 minutes (1 hour)
- Refresh Token: 720 minutes (12 hours)

#### Guards

**1. Token Auth Guard** (`token-auth.guard.ts`)

Validates JWT tokens on protected routes.

```typescript
@Injectable()
export class TokenAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector
  ) {}

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

  private extractToken(request: Request): string {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }
    return authHeader.split(' ')[1];
  }
}
```

**2. Roles Guard** (`roles.guard.ts`)

Enforces role-based access control.

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

**3. Google OAuth Guard** (`apps/pokehub-api/src/auth/google-oauth.guard.ts`)

Verifies Google ID tokens.

```typescript
@Injectable()
export class GoogleOAuthGuard implements CanActivate {
  private readonly oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract Google ID token
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

#### Decorators

**1. TokenAuth Decorator** (`token-auth.decorator.ts`)

Specifies which token type to validate (ACCESS or REFRESH).

```typescript
export const TokenAuth = (tokenType: TokenType) =>
  SetMetadata(TOKEN_AUTH_KEY, tokenType);
```

**Usage**:
```typescript
@Get('access-token')
@UseGuards(TokenAuthGuard)
@TokenAuth('REFRESH_TOKEN')  // Require refresh token
async refreshAccessToken(@User() user: UserJwtData) {
  return await this.authService.refreshAccessToken(user);
}
```

**2. Roles Decorator** (`roles.decorator.ts`)

Specifies required user role.

```typescript
export const Roles = (role: UserAccountRole) =>
  SetMetadata(ROLES_KEY, role);
```

**Usage**:
```typescript
@Get('admin-only')
@UseGuards(TokenAuthGuard, RolesGuard)
@TokenAuth('ACCESS_TOKEN')
@Roles('ADMIN')
async adminEndpoint() {
  return 'Admin-only data';
}
```

**3. User Decorator** (`user.decorator.ts`)

Extracts user data from request (populated by guards).

```typescript
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
```

**Usage**:
```typescript
@Post(':userId/profile')
@UseGuards(TokenAuthGuard)
@TokenAuth('ACCESS_TOKEN')
async updateProfile(
  @Param('userId') userId: string,
  @User() user: UserJwtData
) {
  // user.id, user.email, user.accountRole available
}
```

### 2. Shared Logger

**Package**: `@pokehub/backend/shared-logger`

**Location**: `packages/backend/shared-logger/src/lib/logger.service.ts`

Winston-based logging service with context support.

```typescript
@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
  private context!: string;
  @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger!: Logger;

  setContext(context: string) {
    this.context = context;
  }

  log(message: unknown, ...optionalParams: unknown[]) {
    this.logger.log(message, this.context, ...optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]) {
    this.logger.error(message, this.context, ...optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]) {
    this.logger.warn(message, this.context, ...optionalParams);
  }
}
```

**Usage**:
```typescript
@Injectable()
export class UsersService {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(UsersService.name);
  }

  async createUser() {
    this.logger.log('Creating user...');
    // ...
  }
}
```

**Features**:
- Context-aware logging (class/module name)
- Winston integration (structured logging)
- Transient scope (one instance per injection)
- Supports all log levels (log, error, warn, debug, verbose)

### 3. Shared Exceptions

**Package**: `@pokehub/backend/shared-exceptions`

**Location**: `packages/backend/shared-exceptions/src/lib/service/`

Custom exception classes for service-layer errors.

**ServiceError**:
```typescript
export class ServiceError<T extends ServiceErrorType = 'ServiceError'> extends Error {
  constructor(
    public override name: T,
    public override message: string
  ) {
    super(message);
  }
}

export type ServiceErrorType =
  | 'ServiceError'
  | 'BadRequest'
  | 'Unauthorized';
```

**Usage**:
```typescript
if (!user) {
  throw new ServiceError('Unauthorized', 'User not found');
}
```

**Global Exception Filter** (`apps/pokehub-api/src/app/global-exceptions.filter.ts`):

Catches all exceptions and converts them to HTTP responses.

```typescript
@Catch()
export class CatchEverythingFilter implements ExceptionFilter<unknown> {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(CatchEverythingFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.error('An unhandled exception occurred', exception);

    if (exception instanceof ServiceError) {
      this.handleServiceError(exception, response);
    } else if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());
    } else {
      response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'An Error Occurred' });
    }
  }

  handleServiceError(error: ServiceError<ServiceErrorType>, response: Response) {
    const errorResponse = { message: error.message };
    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    if (error.name === 'BadRequest') {
      status = HttpStatus.BAD_REQUEST; // 400
    } else if (error.name === 'Unauthorized') {
      status = HttpStatus.UNAUTHORIZED; // 401
    }

    response.status(status).json(errorResponse);
  }
}
```

**Error Mapping**:
- `ServiceError('BadRequest')` → 400 Bad Request
- `ServiceError('Unauthorized')` → 401 Unauthorized
- `HttpException` → Returns as-is
- Unknown errors → 500 Internal Server Error

---

## Middleware

### Trace Middleware

**Location**: `apps/pokehub-api/src/common/middleware/trace.middleware.ts`

Adds unique trace IDs to every request for debugging and monitoring.

```typescript
@Injectable()
export class TraceMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const traceId = req.headers['x-trace-id'] || randomUUID();
    typeof traceId === 'string' && requestContext.run({ traceId }, next);
  }
}
```

**Features**:
- Generates UUID for each request
- Accepts `x-trace-id` header from client
- Stored in async context (available in loggers)
- Applied globally to all routes

**Usage in Logs**:
```
[Trace: abc123] UsersService - Creating user...
```

---

## Configuration Management

### Configuration Service

**Location**: `apps/pokehub-api/src/config/configuration.ts`

Centralized configuration loaded from environment variables.

```typescript
export default (): PokeHubApiConfiguration => ({
  appName: 'PokeHubAPI',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    name: process.env.DB_NAME || 'pokehub',
  },
  secrets: {
    ACCESS_TOKEN: {
      value: process.env.ACCESS_TOKEN || 'access',
      expiryMinutes: process.env.ACCESS_TOKEN_EXPIRES ? parseInt(process.env.ACCESS_TOKEN_EXPIRES) : 60,
    },
    REFRESH_TOKEN: {
      value: process.env.REFRESH_TOKEN || 'refresh',
      expiryMinutes: process.env.REFRESH_TOKEN_EXPIRES ? parseInt(process.env.REFRESH_TOKEN_EXPIRES) : 60 * 12,
    },
  },
  googleOAuth: {
    clientId: process.env.GOOGLE_CLIENT_ID || 'default-client-id',
  },
  azure: {
    storageAccount: {
      name: process.env.AZURE_STORAGE_ACCOUNT || 'pokehub',
      avatarContainerName: process.env.AZURE_STORAGE_CONTAINER || 'avatars',
    },
  },
});
```

**Configuration Sections**:

1. **Database** (`db`)
   - Host, port, user, password, database name
   - Defaults for local development

2. **JWT Secrets** (`secrets`)
   - Access token secret + expiry
   - Refresh token secret + expiry

3. **Google OAuth** (`googleOAuth`)
   - Client ID for Google OAuth verification

4. **Azure Storage** (`azure`)
   - Storage account name
   - Avatar container name

**Type Definition** (`configuration.model.ts`):
```typescript
export interface PokeHubApiConfiguration {
  appName: string;
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
  };
  secrets: {
    ACCESS_TOKEN: { value: string; expiryMinutes: number };
    REFRESH_TOKEN: { value: string; expiryMinutes: number };
  };
  googleOAuth: {
    clientId: string;
  };
  azure: {
    storageAccount: {
      name: string;
      avatarContainerName: string;
    };
  };
}
```

**Usage in Services**:
```typescript
constructor(
  private readonly configService: ConfigService<PokeHubApiConfiguration, true>
) {}

const dbConfig = this.configService.get('db', { infer: true });
// Type-safe access with autocomplete
```

---

## API Endpoints Reference

### Authentication Endpoints

**Base Path**: `/api/auth`

#### 1. OAuth Login/Signup

**Route**: `GET /api/auth/oauth-login`

**Guard**: `GoogleOAuthGuard`

**Headers**:
```
Authorization: Bearer <google_id_token>
```

**Response** (200):
```typescript
{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;  // 3600 (1 hour in seconds)
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

**Errors**:
- 401: Invalid Google ID token
- 500: Database error

#### 2. Refresh Access Token

**Route**: `GET /api/auth/access-token`

**Guard**: `TokenAuthGuard` with `REFRESH_TOKEN`

**Headers**:
```
Authorization: Bearer <refresh_token>
```

**Response** (200):
```typescript
{
  accessToken: string;
  expiresIn: number;  // 3600
}
```

**Errors**:
- 401: Invalid or expired refresh token

#### 3. Load User Data

**Route**: `GET /api/auth/load-user`

**Guard**: `TokenAuthGuard` with `ACCESS_TOKEN`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200):
```typescript
{
  id: string;
  email: string;
  username?: string;
  accountRole: 'ADMIN' | 'USER';
  accountType: 'GOOGLE';
  avatarUrl?: string;
}
```

**Errors**:
- 401: Invalid or expired access token
- 404: User not found

### User Endpoints

**Base Path**: `/api/users`

#### 1. Update User Profile

**Route**: `POST /api/users/:userId/profile`

**Guard**: `TokenAuthGuard` with `ACCESS_TOKEN`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```typescript
{
  username: string;    // 5-15 chars, alphanumeric + underscore
  avatar?: string;     // Filename (e.g., "avatar.png")
}
```

**Response** (200):
```typescript
{
  user: {
    id: string;
    email: string;
    username: string;
    accountRole: 'ADMIN' | 'USER';
    accountType: 'GOOGLE';
    avatarUrl?: string;
  };
}
```

**Errors**:
- 400: Invalid username format
- 401: Invalid access token
- 403: Cannot update another user's profile
- 409: Username already taken
- 500: Database error

#### 2. Check User Existence

**Route**: `HEAD /api/users/:id?dataType=username`

**Guard**: `TokenAuthGuard` with `ACCESS_TOKEN`

**Query Parameters**:
- `dataType`: `'username' | 'id'` (default: 'id')

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response**:
- 200: User exists
- 404: User not found

**Errors**:
- 401: Invalid access token

---

## Data Transfer Objects (DTOs)

### Authentication DTOs

**OAuthLoginResponse** (`@pokehub/shared/shared-auth-models`):
```typescript
export interface OAuthLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserCore;
}
```

**AccessToken**:
```typescript
export interface AccessToken {
  accessToken: string;
  expiresIn: number;
}
```

**Tokens**:
```typescript
export interface Tokens {
  accessToken: string;
  refreshToken: string;
}
```

**UserJwtData**:
```typescript
export interface UserJwtData {
  id: string;
  email: string;
  accountRole: UserAccountRole;
}
```

### User DTOs

**UserCore** (`@pokehub/shared/shared-user-models`):
```typescript
export interface UserCore {
  id: string;
  email: string;
  username?: string;
  accountRole: UserAccountRole;
  accountType: UserAccountType;
  avatarUrl?: string;
}
```

**UpdateUserProfileDTO**:
```typescript
export interface IUpdateUserProfile {
  username: string;
  avatar?: string;  // Filename
}
```

**UpdateUserProfileResponse**:
```typescript
export interface UpdateUserProfileResponse {
  user: UserCore;
}
```

---

## Security

### Authentication Flow

1. **User logs in via Google OAuth** (frontend)
2. **Frontend receives Google ID token**
3. **Frontend sends ID token to backend**: `GET /api/auth/oauth-login`
4. **Backend verifies token with Google**: `GoogleOAuthGuard`
5. **Backend creates/fetches user** from database
6. **Backend generates JWT tokens** (access + refresh)
7. **Backend returns tokens + user data**
8. **Frontend stores tokens** in NextAuth session
9. **Frontend includes access token** in subsequent requests
10. **Backend validates access token** via `TokenAuthGuard`

### Token Security

- **Separate Secrets**: Access and refresh tokens use different secrets
- **Short-Lived Access Tokens**: 1 hour expiry (minimizes exposure)
- **Refresh Token Rotation**: Refresh tokens expire after 12 hours
- **Signature Validation**: All tokens verified with `jsonwebtoken`
- **Expiry Validation**: Expired tokens rejected automatically

### Authorization

- **User Isolation**: Users can only access their own data
  - Enforced via `@User()` decorator + service-layer checks
- **Role-Based Access Control**: Admin vs User roles
  - Enforced via `RolesGuard`
- **Input Validation**: All DTOs validated via `ValidationPipe`
- **SQL Injection Prevention**: Drizzle ORM parameterizes queries

### CORS Configuration

```typescript
app.enableCors();  // Allows all origins (development)
```

**Production Recommendation**:
```typescript
app.enableCors({
  origin: ['https://pokehub.app'],
  credentials: true,
});
```

---

## Error Handling Strategy

### Exception Hierarchy

```
Unknown Error
├── HttpException (NestJS built-in)
│   ├── BadRequestException
│   ├── UnauthorizedException
│   ├── ForbiddenException
│   └── NotFoundException
├── ServiceError (Custom)
│   ├── ServiceError('BadRequest')
│   ├── ServiceError('Unauthorized')
│   └── ServiceError('ServiceError')  // Generic
└── Other (Unhandled)
```

### Error Response Format

**ServiceError & HttpException**:
```json
{
  "message": "Error description"
}
```

**Unknown Errors**:
```json
{
  "message": "An Error Occurred"
}
```

### Best Practices

1. **Service Layer**: Throw `ServiceError` for business logic errors
2. **Controller Layer**: Throw `HttpException` for HTTP-specific errors
3. **Database Layer**: Throw `ServiceError` on query failures
4. **Guards**: Throw `UnauthorizedException` for auth failures
5. **Global Filter**: Catches all exceptions, logs them, and converts to HTTP responses

---

## Logging

### Log Levels

- **log**: General information
- **error**: Errors and exceptions
- **warn**: Warnings
- **debug**: Debug information
- **verbose**: Detailed logs

### Logging Best Practices

```typescript
@Injectable()
export class UsersService {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(UsersService.name);  // Set context once
  }

  async createUser(email: string) {
    this.logger.log(`${this.createUser.name}: Creating user with email ${email}`);

    try {
      const user = await this.usersDb.createUser(email);
      this.logger.log(`${this.createUser.name}: User created successfully`);
      return user;
    } catch (error) {
      this.logger.error(`${this.createUser.name}: Failed to create user`, error);
      throw error;
    }
  }
}
```

**Output Example**:
```
[UsersService] createUser: Creating user with email test@example.com
[UsersService] createUser: User created successfully
```

---

## Database Migrations

### Drizzle Kit

Drizzle migrations are managed via `drizzle-kit`.

**Configuration**: `drizzle.config.pg.ts`

**Common Commands**:

```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Push schema changes to database (without migrations)
npx drizzle-kit push

# View current schema
npx drizzle-kit introspect
```

### Migration Workflow

1. **Update schema** in `user.schema.ts`
2. **Generate migration**: `npx drizzle-kit generate`
3. **Review migration** in `drizzle/` folder
4. **Apply migration**: `npx drizzle-kit push`

**Example Migration** (generated):
```sql
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "username" text UNIQUE,
  "email" text UNIQUE NOT NULL,
  "accountRole" "accountRole" DEFAULT 'USER' NOT NULL,
  "accountType" "accountType" NOT NULL,
  "avatarFilename" text
);

CREATE TYPE "accountRole" AS ENUM('ADMIN', 'USER');
CREATE TYPE "accountType" AS ENUM('GOOGLE');
```

---

## Development Workflow

### Running the Backend

```bash
# Development mode (with watch)
nx serve pokehub-api

# Production build
nx build pokehub-api

# Run production build
node dist/apps/pokehub-api/main.js
```

### Testing

```bash
# Run all backend tests
nx test pokehub-api

# Run tests for specific package
nx test pokehub-users-db

# Run tests in watch mode
nx test pokehub-api --watch
```

### Linting

```bash
# Lint backend
nx lint pokehub-api

# Lint all backend packages
nx run-many -t lint --projects=pokehub-api,pokehub-postgres,pokehub-users-db
```

---

## Environment Variables

### Required Variables

**.env** (Backend):
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=pokehub

# JWT Secrets
ACCESS_TOKEN=your-access-token-secret-here
REFRESH_TOKEN=your-refresh-token-secret-here
ACCESS_TOKEN_EXPIRES=60        # minutes
REFRESH_TOKEN_EXPIRES=720      # minutes (12 hours)

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Azure Storage
AZURE_STORAGE_ACCOUNT=pokehub
AZURE_STORAGE_CONTAINER=avatars

# Server
PORT=3000
```

### Optional Variables

```bash
# Logging
LOG_LEVEL=debug  # log, error, warn, debug, verbose

# CORS
CORS_ORIGIN=http://localhost:4200
```

---

## Deployment

### Production Checklist

1. **Environment Variables**:
   - Set strong JWT secrets
   - Configure production database credentials
   - Set Google OAuth production client ID
   - Configure Azure storage account

2. **CORS Configuration**:
   ```typescript
   app.enableCors({
     origin: process.env.CORS_ORIGIN || 'https://pokehub.app',
     credentials: true,
   });
   ```

3. **Database Migrations**:
   - Run `npx drizzle-kit push` on production database
   - Test migrations on staging first

4. **Security Headers**:
   - Consider using `helmet` middleware
   - Enable HTTPS
   - Set secure cookie flags

5. **Logging**:
   - Configure log aggregation (e.g., CloudWatch, Datadog)
   - Set appropriate log levels

6. **Health Checks**:
   - Add `/api/health` endpoint
   - Monitor database connectivity

### Recommended Deployment Platforms

- **Railway**: Easy NestJS deployment with PostgreSQL
- **Render**: Free tier available, good for prototypes
- **AWS Elastic Beanstalk**: Enterprise-grade, auto-scaling
- **Heroku**: Simple deployment, PostgreSQL add-on
- **DigitalOcean App Platform**: Cost-effective, simple setup

---

## Performance Optimization

### Database Query Optimization

1. **Use Indexes**:
   ```typescript
   // Add indexes to frequently queried columns
   export const usersTable = pgTable(USERS_TABLE, {
     email: text('email').notNull().unique(),  // Unique creates index
     username: text('username').unique(),      // Unique creates index
   });
   ```

2. **Select Only Needed Columns**:
   ```typescript
   // Bad
   const user = await db.select().from(usersTable).where(eq(usersTable.id, userId));

   // Good
   const user = await db
     .select({ id: usersTable.id, email: usersTable.email })
     .from(usersTable)
     .where(eq(usersTable.id, userId));
   ```

3. **Use Batching** for multiple queries

### API Performance

1. **Enable Compression**:
   ```typescript
   import compression from 'compression';
   app.use(compression());
   ```

2. **Rate Limiting**:
   ```typescript
   import rateLimit from 'express-rate-limit';

   app.use(rateLimit({
     windowMs: 15 * 60 * 1000,  // 15 minutes
     max: 100  // limit each IP to 100 requests per windowMs
   }));
   ```

3. **Caching** (future):
   - Add Redis for session caching
   - Cache user profiles

---

## Testing Strategy

### Unit Tests

Test individual services in isolation.

**Example** (`users.service.spec.ts`):
```typescript
describe('UsersService', () => {
  let service: UsersService;
  let mockUsersDb: jest.Mocked<IUsersDBService>;

  beforeEach(() => {
    mockUsersDb = {
      createUser: jest.fn(),
      getUserByEmail: jest.fn(),
      // ...
    } as any;

    service = new UsersService(mockUsersDb, mockLogger, mockConfig);
  });

  it('should create a user', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    mockUsersDb.createUser.mockResolvedValue(mockUser);

    const result = await service.createUser('test@example.com');

    expect(result).toEqual(mockUser);
    expect(mockUsersDb.createUser).toHaveBeenCalledWith('test@example.com', 'GOOGLE');
  });
});
```

### Integration Tests

Test controllers + services + database together.

```typescript
describe('AuthController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('/api/auth/oauth-login (GET)', async () => {
    return request(app.getHttpServer())
      .get('/api/auth/oauth-login')
      .set('Authorization', 'Bearer <valid-google-token>')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
      });
  });
});
```

### E2E Tests

Test full user flows end-to-end.

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Error**: `Failed to connect to database`

**Solutions**:
- Check `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS` environment variables
- Ensure PostgreSQL is running: `pg_isready`
- Check firewall rules
- Verify database exists: `psql -l`

#### 2. JWT Validation Failed

**Error**: `Invalid token` or `Token has expired`

**Solutions**:
- Verify `ACCESS_TOKEN` and `REFRESH_TOKEN` secrets match
- Check token expiry times
- Ensure frontend sends token in `Authorization: Bearer <token>` header
- Check for clock skew between servers

#### 3. Google OAuth Verification Failed

**Error**: `Invalid Google ID token`

**Solutions**:
- Verify `GOOGLE_CLIENT_ID` matches frontend configuration
- Ensure Google OAuth consent screen is configured
- Check token audience in Google token payload

#### 4. CORS Errors

**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solutions**:
- Ensure `app.enableCors()` is called in `main.ts`
- Configure CORS origin: `app.enableCors({ origin: 'http://localhost:4200' })`
- Check frontend is sending requests to correct API URL

---

## Future Enhancements

### Planned Features

1. **Team Management API**:
   - CRUD endpoints for Pokemon teams
   - Team sharing and collaboration
   - Team validation (tier rules, move legality)

2. **Battle Simulation API**:
   - Damage calculator
   - Team matchup analysis
   - AI opponent suggestions

3. **Real-time Features**:
   - WebSocket support for live battles
   - Real-time notifications
   - Collaborative team building

4. **Caching Layer**:
   - Redis for session storage
   - Cache frequently accessed data (user profiles, teams)
   - Invalidation strategies

5. **Rate Limiting**:
   - Per-user rate limits
   - Per-endpoint limits
   - Abuse prevention

6. **Admin Features**:
   - User management dashboard API
   - Analytics endpoints
   - Content moderation

### Potential Improvements

- **GraphQL API**: Alternative to REST for flexible querying
- **gRPC**: For internal service communication
- **Event Sourcing**: For audit trails and complex workflows
- **Microservices**: Split into auth, teams, battle services
- **Message Queue**: For background jobs (email, notifications)
- **API Versioning**: `/api/v1/auth`, `/api/v2/auth`
- **Swagger/OpenAPI**: Auto-generated API documentation
- **Health Checks**: `/api/health`, `/api/ready` endpoints

---

## Dependencies

### Core Dependencies

```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/core": "^10.0.0",
  "@nestjs/platform-express": "^10.0.0",
  "@nestjs/config": "^3.0.0",
  "drizzle-orm": "^0.33.0",
  "postgres": "^3.4.0",
  "jsonwebtoken": "^9.0.0",
  "google-auth-library": "^9.0.0",
  "winston": "^3.11.0",
  "nest-winston": "^1.9.4"
}
```

### Dev Dependencies

```json
{
  "@nestjs/testing": "^10.0.0",
  "@types/jest": "^29.5.0",
  "jest": "^29.5.0",
  "drizzle-kit": "^0.24.0"
}
```

---

## Appendix

### File Structure Reference

```
Backend Codebase
├── apps/pokehub-api/
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.module.ts
│   │   │   ├── app.routes.ts
│   │   │   └── global-exceptions.filter.ts
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── google-oauth.guard.ts
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   └── users.service.ts
│   │   ├── common/
│   │   │   ├── common.module.ts
│   │   │   └── middleware/trace.middleware.ts
│   │   ├── config/
│   │   │   ├── configuration.ts
│   │   │   └── configuration.model.ts
│   │   └── main.ts
│   └── project.json
│
└── packages/backend/
    ├── pokehub-postgres/
    │   ├── src/lib/
    │   │   ├── postgres.module.ts
    │   │   └── postgres.service.ts
    │   └── project.json
    │
    ├── pokehub-users-db/
    │   ├── src/lib/
    │   │   ├── schema/user.schema.ts
    │   │   ├── users-db.module.ts
    │   │   ├── users-db.service.ts
    │   │   └── users-db-service.interface.ts
    │   └── project.json
    │
    ├── shared-auth-utils/
    │   ├── src/lib/
    │   │   ├── jwt.service.ts
    │   │   ├── token-auth.guard.ts
    │   │   ├── token-auth.decorator.ts
    │   │   ├── roles.guard.ts
    │   │   ├── roles.decorator.ts
    │   │   └── user.decorator.ts
    │   └── project.json
    │
    ├── shared-exceptions/
    │   ├── src/lib/service/
    │   │   ├── service-error.model.ts
    │   │   └── service-error.type.ts
    │   └── project.json
    │
    └── shared-logger/
        ├── src/lib/
        │   ├── logger.module.ts
        │   └── logger.service.ts
        └── project.json
```

### Glossary

- **DTO**: Data Transfer Object - Plain objects for data transfer between layers
- **Guard**: NestJS concept for authentication/authorization logic
- **Decorator**: TypeScript metadata for enhancing classes/methods
- **Provider**: Injectable service in NestJS DI system
- **Module**: Organizational unit in NestJS (group of related components)
- **Drizzle ORM**: TypeScript ORM for SQL databases
- **JWT**: JSON Web Token - Token-based authentication standard
- **OAuth**: Open Authorization - Delegated authorization framework

---

## Changelog

### Initial Version (2025-01-14)

- ✅ NestJS application setup
- ✅ PostgreSQL with Drizzle ORM
- ✅ Authentication module (Google OAuth + JWT)
- ✅ Users module (profile management)
- ✅ JWT token guards and decorators
- ✅ Global exception handling
- ✅ Winston logging integration
- ✅ Request tracing middleware
- ✅ Configuration management
- ✅ User database schema
- ✅ Shared backend packages
- ✅ CORS support
- ✅ Input validation
