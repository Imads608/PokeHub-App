# Deployment Guide

This guide covers how to build and run the PokeHub application in production mode.

## Table of Contents

- [Production Deployment](#production-deployment)
  - [Frontend (pokehub-app)](#frontend-pokehub-app)
  - [Backend (pokehub-api)](#backend-pokehub-api)
  - [Build All Projects](#build-all-projects)
- [Development vs Production](#development-vs-production)
- [Environment Configuration](#environment-configuration)
- [Production Checklist](#production-checklist)
- [Production Optimizations](#production-optimizations)
- [Bundle Analysis](#bundle-analysis)
  - [Setup](#setup)
  - [Running the Analyzer](#running-the-analyzer)
  - [Understanding the Output](#understanding-the-output)
  - [Optimization Tips](#optimization-tips)
  - [Target Bundle Sizes](#target-bundle-sizes)
  - [What Determines Per-Route Bundle Size?](#what-determines-per-route-bundle-size)
  - [SSR vs Server Components (Important Distinction)](#ssr-vs-server-components-important-distinction)
  - [Analyzing Bundle Size with Bundle Analyzer](#analyzing-bundle-size-with-bundle-analyzer)
  - [How to Reduce Bundle Size](#how-to-reduce-bundle-size)
  - [Decision Tree: Will This Add to the Client Bundle?](#decision-tree-will-this-add-to-the-client-bundle)
  - [How App Router Handles Layout Client Components (Case Study: @pkmn/dex)](#how-app-router-handles-layout-client-components-case-study-pkmndex)
- [Deployment Platforms](#deployment-platforms)
  - [Docker (Recommended)](#docker-recommended)
  - [Vercel (Frontend)](#vercel-frontend)
  - [VPS/Cloud Providers](#vpscloud-providers)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Production Deployment

### Frontend (pokehub-app)

#### 1. Build for Production

Build the Next.js application with optimized, minified bundles:

```bash
nx build pokehub-app
```

This command:

- Creates an optimized production build in `dist/apps/pokehub-app`
- Minifies JavaScript and CSS
- Removes debug symbols and source maps
- Optimizes images and assets
- Generates static pages where possible

#### 2. Run the Production Server

Navigate to the build output directory and start the Next.js production server:

```bash
cd dist/apps/pokehub-app
npx next start
```

**Important:** Using `next start` ensures that the application serves **minified chunks without debug symbols**. This is different from development mode (`nx serve pokehub-app`), which serves unminified code with source maps for debugging. In production mode:

- All JavaScript bundles are minified and optimized
- Debug symbols and source maps are removed
- Code is obfuscated and compressed
- Performance is optimized for end users

The application will start on port 3000 by default.

**Custom Port:**

```bash
npx next start -p 4200
```

Or set via environment variable:

```bash
PORT=4200 npx next start
```

#### 3. Running the Standalone Build Locally

Next.js outputs a standalone build that includes only the necessary dependencies. This is useful for testing production builds locally before containerized deployments.

**Step 1: Build with environment variables**

```bash
NEXT_PUBLIC_POKEHUB_API_URL=http://localhost:3000/api npx nx build pokehub-app --configuration=production
```

**Step 2: Navigate to the standalone directory**

```bash
cd dist/apps/pokehub-app/.next/standalone
```

**Step 3: Copy static assets**

The standalone build doesn't include static files by default. Copy them manually:

```bash
cp -r ../static ./dist/apps/pokehub-app/.next/static
cp -r ../../../../apps/pokehub-app/public ./apps/pokehub-app/public
```

**Step 4: Start the server**

```bash
PORT=4200 node apps/pokehub-app/server.js
```

The application will be available at `http://localhost:4200`.

### Backend (pokehub-api)

#### 1. Build the API

```bash
nx build pokehub-api
```

This creates a production build in `dist/apps/pokehub-api`

#### 2. Run the Production API

```bash
node dist/apps/pokehub-api/main.js
```

### Build All Projects

To build both frontend and backend together:

```bash
nx run-many -t build
```

## Development vs Production

| Aspect        | Development (`nx serve`)    | Production (`next start`) |
| ------------- | --------------------------- | ------------------------- |
| Bundle Size   | Larger (unminified)         | Smaller (minified)        |
| Debug Symbols | Included                    | Removed                   |
| Source Maps   | Generated                   | Not included              |
| Code          | Readable                    | Obfuscated/minified       |
| Performance   | Slower (hot reload enabled) | Optimized                 |
| Purpose       | Debugging & development     | End users                 |

## Environment Configuration

### Required Environment Variables

Before running in production, ensure these environment variables are configured:

**Frontend (.env.production or .env):**

- `NEXTAUTH_URL` - Your production domain URL
- `NEXTAUTH_SECRET` - Secret for NextAuth.js session encryption
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `NEXT_PUBLIC_API_URL` - Backend API URL

**Backend (.env):**

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- `AZURE_STORAGE_CONNECTION_STRING` - Azure Blob Storage connection
- `AZURE_STORAGE_CONTAINER_NAME` - Container name for file uploads

## Production Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] Database migrations applied (`npx drizzle-kit push`)
- [ ] Build completes without errors
- [ ] Tests pass (`nx run-many -t test`)
- [ ] Linting passes (`nx run-many -t lint`)
- [ ] SSL/TLS certificates configured
- [ ] Reverse proxy configured (nginx/apache)
- [ ] CORS settings verified
- [ ] OAuth redirect URIs updated for production domain

## Production Optimizations

The production builds include:

- **Code Splitting**: Automatic chunking for optimal loading
- **Tree Shaking**: Removal of unused code
- **Minification**: JavaScript and CSS compression
- **Image Optimization**: Next.js automatic image optimization
- **SSR/SSG**: Server-side rendering and static generation where applicable

## Bundle Analysis

Use the Webpack Bundle Analyzer to visualize and optimize your bundle size.

### Setup

1. **Install the bundle analyzer:**

```bash
npm install --save-dev @next/bundle-analyzer
```

2. **Configure Next.js** (if not already configured):

Update `apps/pokehub-app/next.config.js`:

```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... your existing next.config.js settings
});
```

### Running the Analyzer

Run the bundle analyzer using the dedicated Nx target:

```bash
nx analyze pokehub-app
```

Or manually with the environment variable:

```bash
ANALYZE=true nx build pokehub-app
```

This will:

1. Build the production bundle
2. Generate interactive HTML reports
3. Automatically open the reports in your browser (disabled in CI)

The build generates reports from two analyzers:

**Webpack Bundle Analyzer** (visual treemap):
- `dist/apps/pokehub-app/.next/analyze/client.html` - Client-side JavaScript
- `dist/apps/pokehub-app/.next/analyze/nodejs.html` - Server-side code
- `dist/apps/pokehub-app/.next/analyze/edge.html` - Edge runtime code

**Statoscope** (detailed stats and validation):
- `apps/pokehub-app/statoscope-report-client.html` - Client bundle analysis
- `apps/pokehub-app/statoscope-report-server.html` - Server bundle analysis
- `apps/pokehub-app/statoscope-stats-client.json` - Stats for CI comparison

Statoscope is used in CI to validate bundle size changes between PRs and main branch.

### Understanding the Output

The bundle analyzer displays:

- **Interactive treemap**: Visual representation of bundle composition
- **File sizes**: Parsed, gzipped, and original sizes
- **Module relationships**: What's included in each chunk
- **Large dependencies**: Identify heavy packages

#### Statoscope "Initial Size" is Misleading for Next.js App Router

Statoscope computes "initial size" for an entrypoint using the query `(data.chunks + data.chunks..children).[initial].files` — it **recursively walks all children** of the entry's chunks, includes every initial chunk in the tree, and sums their sizes.

This affects **any entrypoint that has children** in webpack's chunk graph, not just the root layout:

- **`app/layout`** (worst case): rolls up every page's chunks across the entire app, since the root layout is the parent of all page chunks. Statoscope may report ~1.5 MB, but this includes chunks for `/pokedex`, `/battle`, `/team-builder`, and every other route.
- **Nested layouts** (e.g., `app/pokedex/layout`): rolls up child pages like `app/pokedex/page` and `app/pokedex/[id]/page`. Less inflated than the root, but still overstated.
- **Leaf pages** (e.g., `app/login/page`): no children, so the reported size is accurate.

**This does not reflect what the browser actually downloads.** When a user visits a specific page, Next.js only loads:

1. Framework chunks (`main`, `framework`, `webpack`)
2. The layout entry chunks for the route's layout hierarchy
3. The specific page's entry chunks (e.g., `app/pokedex/page`)

The actual initial download for a layout is just its own chunks (items 1-2) — significantly smaller than what statoscope reports.

**To get accurate per-route sizes**, check leaf page entrypoints in statoscope (e.g., `app/login/page`) rather than layout entrypoints. You can also inspect the actual network requests in the browser's DevTools Network tab to see exactly which chunks are downloaded for a given route.

### Optimization Tips

Use the analyzer to:

1. **Identify large dependencies**: Replace or lazy-load heavy packages
2. **Check for duplicates**: Ensure libraries aren't bundled multiple times
3. **Verify code splitting**: Confirm dynamic imports create separate chunks
4. **Monitor bundle size**: Track changes over time

**Example findings:**

- If a large library appears in multiple chunks, consider moving it to a shared chunk
- If a rarely-used feature adds significant size, lazy-load it with `dynamic()` imports
- If the initial bundle is too large, implement route-based code splitting

### Target Bundle Sizes

Aim for:

- **Per-route JS**: < 200 KB gzipped (ideal), < 300 KB gzipped (acceptable)
- **Shared chunks**: Optimize for caching (stable naming)

Use `ANALYZE=true nx build pokehub-app` and check individual page entrypoints in statoscope or the webpack bundle analyzer to measure per-route sizes.

### What Determines Per-Route Bundle Size?

Code is included in a route's initial bundle based on whether it runs on the **client** or **server**:

#### ✅ Included (Adds to Route's Initial Bundle):

1. **Client Components** - Any component with `'use client'`:

   ```typescript
   'use client';
   
   import { Button } from '@/components/ui';
   import { useState } from 'react';
   
   // ← Included
   
   export default function LoginForm() {
     // All this JavaScript goes to the client bundle
   }
   ```

2. **Client Component Dependencies** - Everything imported by client components:

   - Icon libraries (lucide-react, react-icons)
   - Form libraries (react-hook-form, zod)
   - Animation libraries (framer-motion)
   - UI components marked with `'use client'`

3. **Layout Client Components** - Layouts that wrap your routes:

   ```
   app/
     layout.tsx          ← If 'use client', affects ALL routes
     login/
       layout.tsx        ← If 'use client', affects /login
       page.tsx
   ```

4. **Shared Framework Chunks** - Always included in every route:
   - React runtime
   - Next.js client runtime
   - Webpack runtime
   - Common dependencies

#### ❌ NOT Included (Server-Side Only):

1. **Server Components** - Default Next.js components (no `'use client'`):

   ```typescript
   // No 'use client' directive = Server Component
   import { db } from '@/lib/db';
   
   // ← NOT in client bundle
   
   export default async function LoginPage() {
     const data = await db.query(); // ← Runs on server only
     return <LoginForm initialData={data} />;
   }
   ```

2. **Server-Only Imports**:

   - Database clients (Prisma, Drizzle)
   - Server-side utilities (bcrypt, jsonwebtoken)
   - Node.js modules (fs, path, crypto)
   - API route handlers

3. **Dynamic Imports with `ssr: false`**:
   ```typescript
   const HeavyComponent = dynamic(() => import('./Heavy'), {
     ssr: false, // ← Loaded on-demand, not in initial bundle
   });
   ```

### SSR vs Server Components (Important Distinction)

**Client Components are still SSR'd by default**, but they add to the route's initial bundle:

|                                    | Server Component | Client Component      |
| ---------------------------------- | ---------------- | --------------------- |
| Rendered on server?                | Yes ✓            | Yes ✓ (SSR)           |
| JavaScript sent to client?         | **No**           | **Yes**               |
| Adds to route's initial bundle?    | **No**           | **Yes**               |
| Can use hooks/state?               | No               | Yes                   |
| Interactive?                       | No               | Yes (after hydration) |

**Example:**

```typescript
'use client'; // ← Client Component
export default function LoginForm() {
  const [email, setEmail] = useState('');
  // ...
}
```

This component:

- **IS** Server-Side Rendered (HTML generated on server)
- **DOES** add to route's initial bundle (JavaScript sent for hydration)
- User sees HTML fast, then JavaScript downloads to make it interactive

### Analyzing Bundle Size with Bundle Analyzer

The bundle analyzer shows **parsed** (uncompressed) sizes by default. Look for the **gzipped size** in the tooltip/sidebar for a more realistic transfer size — parsed size is typically 3-4x larger than gzipped.

**When filtering by a route** (e.g., filter by `app/login/page`):

- The Bundle Analyzer displays the **complete initial bundle** for that route
- You'll see the route-specific chunks **PLUS** all shared framework chunks
- This is why filtering by `/login` shows more than just the route-specific code

**Example workflow:**

1. Run `ANALYZE=true nx build pokehub-app`
2. In the analyzer, filter by `app/login/page`
3. All chunks shown = what loads for the `/login` route

### How to Reduce Initial Bundle Size

1. **Keep pages as Server Components** when possible:

   ```typescript
   // ✅ Good: Server Component (default)
   export default async function Page() {
     const data = await fetchData();
     return <ClientForm data={data} />;
   }
   ```

2. **Push `'use client'` down the component tree**:

   ```typescript
   // ❌ Bad: Entire page is client component
   'use client';
   export default function Page() {
     return (
       <div>
         <StaticHeader /> {/* Doesn't need client */}
         <InteractiveForm /> {/* Needs client */}
       </div>
     );
   }
   
   // ✅ Good: Only interactive parts are client
   export default function Page() {
     // Server Component
     return (
       <div>
         <StaticHeader /> {/* Server Component */}
         <InteractiveForm /> {/* Client Component */}
       </div>
     );
   }
   ```

3. **Import only what you need** from libraries:

   ```typescript
   // ❌ Bad: Imports entire library
   import * as Icons from 'lucide-react';
   // ✅ Good: Import specific icons
   import { Home, User, Settings } from 'lucide-react';
   ```

4. **Use dynamic imports** for heavy components:

   ```typescript
   import dynamic from 'next/dynamic';
   
   const HeavyChart = dynamic(() => import('./HeavyChart'), {
     loading: () => <Spinner />,
     ssr: false, // Optional: skip SSR if not needed
   });
   ```

5. **Check for duplicate dependencies**:

   - Use bundle analyzer to spot libraries bundled multiple times
   - Ensure consistent versions across packages

6. **Replace heavy libraries** with lighter alternatives:
   - ❌ Moment.js (67 KB) → ✅ date-fns (tree-shakeable)
   - ❌ Lodash (full) → ✅ Individual lodash methods
   - ❌ Entire icon packs → ✅ Specific icons

### Decision Tree: Will This Add to the Route's Initial Bundle?

```
Does the file have 'use client'?
├─ Yes → Is it imported by the route or layout?
│   ├─ Yes → ✓ Adds to route's initial bundle
│   └─ No → ✗ Not included
└─ No → Server Component
    └─ ✗ Does NOT add to initial bundle

Is it a dependency/import?
├─ Imported by Client Component → ✓ Adds to route's initial bundle
└─ Imported by Server Component → ✗ Does NOT add
```

### How App Router Handles Layout Client Components (Case Study: @pkmn/dex)

**Key Finding:** Client components in `app/layout.tsx` are NOT automatically included in every route's initial bundle. Next.js performs **per-route tree-shaking and optimization**.

#### Real Example from PokeHub

**Setup:**

```typescript
import { Dex } from '@pkmn/dex';

// app/layout.tsx (Server Component)
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AppBootstrapper>{children}</AppBootstrapper>
      </body>
    </html>
  );
}

// app/(components)/bootstrapper.tsx (Client Component)
('use client');
// 322 KB gzipped!

export const AppBootstrapper = ({ children }) => {
  useEffect(() => {
    window.Dex = Dex; // Assign to global
  }, []);

  return <SharedAppBootstrapper>{children}</SharedAppBootstrapper>;
};
```

**What You Might Expect:**

- AppBootstrapper wraps all routes
- AppBootstrapper imports Dex (322 KB)
- All routes should include Dex in their initial bundle ❌

**What Actually Happens:**

| Route           | Imports Dex Directly? | Dex in Initial Bundle? | Why?                                |
| --------------- | --------------------- | ---------------------- | ----------------------------------- |
| `/login`        | ❌ No                 | ❌ No                 | Tree-shaken - route doesn't need it |
| `/pokedex/[id]` | ✅ Yes                | ✅ Yes                | Route imports it, so included       |
| `/team-builder` | ❌ No                 | ❌ No                 | Tree-shaken - route doesn't need it |

#### How This Works

**Next.js analyzes each route independently:**

1. **Route dependency graph analysis**

   - What does this route import?
   - What dependencies are actually used?
   - Which layout client components have dependencies this route needs?

2. **Per-route tree-shaking**

   ```typescript
   // For /login route
   import { Dex } from '@pkmn/dex';
   
   // Imported in AppBootstrapper
   
   useEffect(() => {
     window.Dex = Dex; // Used, but login doesn't reference Dex
   }, []);
   
   // Next.js: "Login doesn't import Dex anywhere, tree-shake it out"
   // Result: Dex NOT in login's bundle
   ```

3. **Lazy/async chunk loading**
   - Non-critical dependencies loaded with `async` attribute
   - They may load in parallel but aren't part of the route's initial bundle
   - Dex chunks load asynchronously when needed

#### Verification Steps

**Test 1: Check if dependency loads**

```typescript
// Remove window.Dex assignment in AppBootstrapper
useEffect(() => {
  // window.Dex = Dex;  // Commented out
}, []);
```

**Result:**

- Navigate to `/login` → Dex chunk does NOT load ✅
- Navigate to `/pokedex/[id]` → Dex chunk DOES load (route imports it) ✅

**Test 2: Check bundle analyzer**

```bash
ANALYZE=true nx build pokehub-app
```

Filter by `app/login/page`:

- ❌ No `@pkmn/dex` in the bundle
- ✅ Initial bundle: ~189 KB (without 322 KB Dex)

Filter by `app/pokedex/[id]/page`:

- ✅ `@pkmn/dex` appears in chunks
- ✅ Initial bundle: ~511 KB (includes 322 KB Dex)

#### Key Differences from Pages Router

| Pages Router (`pages/_app.js`)             | App Router (`app/layout.tsx`)                             |
| ------------------------------------------ | --------------------------------------------------------- |
| All imports shared across all pages        | Per-route tree-shaking                                    |
| Heavy library in `_app` → all pages get it | Heavy library in layout → only routes that need it get it |
| No tree-shaking across pages               | Aggressive per-route optimization                         |
| Shared bundle strategy                     | Granular code splitting                                   |

#### Script Tag Attributes Don't Determine the Initial Bundle

**Common misconception:**

```html
<!-- This has async, so it's not in the initial bundle? WRONG! -->
<script src="/_next/static/chunks/framework.js" async=""></script>
```

**Reality:**

- Script loading attributes (`async`, `defer`) don't determine what's in the initial bundle
- The initial bundle is determined by the **dependency graph**
- Both critical and non-critical chunks may use `async`
- What's included is based on what the route imports, not how it's loaded

#### Implications for Optimization

**Best Practice: Import where needed**

```typescript
// ❌ Bad: Force global loading in layout
'use client';
import { Dex } from '@pkmn/dex';

useEffect(() => {
  console.log(Dex.species.all().length); // Forces Dex for all routes
  window.Dex = Dex;
}, []);

// ✅ Good: Import in routes that need it
// app/pokedex/[id]/page.tsx
('use client');
import { Dex } from '@pkmn/dex'; // Only loaded for this route

export default function PokemonPage() {
  const species = Dex.species.get('pikachu');
  // ...
}
```

**Benefits of per-route imports:**

- ✅ Automatic tree-shaking for routes that don't need it
- ✅ TypeScript type safety
- ✅ Explicit dependencies (easier to track)
- ✅ Optimal initial bundle for each route
- ✅ No need for global `window` objects

**When to use layout-level imports:**

- Truly shared utilities needed by ALL routes
- Small dependencies (< 10 KB)
- Critical for app initialization

**When to use route-level imports:**

- Heavy libraries (like @pkmn/dex at 322 KB)
- Feature-specific dependencies
- Only needed by subset of routes

#### Summary

The App Router's per-route optimization means:

1. **Layout client component imports are NOT automatically in all routes**
2. **Each route gets its own optimized bundle**
3. **Heavy dependencies are only included where needed**
4. **Tree-shaking works per-route, even for layout code**
5. **Each route's initial bundle accurately reflects what that route actually needs**

This is a significant improvement over the Pages Router and results in much better bundle optimization out of the box.

## Deployment Platforms

### Docker (Recommended)

For containerized deployments, you can create Docker images for both frontend and backend.

### Vercel (Frontend)

The Next.js app can be deployed to Vercel:

```bash
vercel --prod
```

### VPS/Cloud Providers

For traditional hosting, use a process manager like PM2:

```bash
npm install -g pm2

# Start frontend
cd dist/apps/pokehub-app
pm2 start "npx next start" --name pokehub-app

# Start backend
pm2 start dist/apps/pokehub-api/main.js --name pokehub-api
```

## Monitoring

In production, monitor:

- Application logs
- Database connection pool
- API response times
- Error rates
- Resource usage (CPU, memory)

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
npx next start -p 3001
```

### Missing Dependencies

If you encounter module errors, ensure node_modules is installed:

```bash
npm install
```

### Database Connection Issues

Verify DATABASE_URL is correct and PostgreSQL is accessible from the production environment.
