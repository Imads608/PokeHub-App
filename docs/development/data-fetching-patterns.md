# Data Fetching Patterns Guide

## Overview

This guide documents all data fetching patterns used in PokeHub. The application uses **TanStack Query (React Query)** for server state management with a consistent pattern for hooks, API clients, and error handling.

**Key Libraries**:
- `@tanstack/react-query` - Server state management
- Custom fetch clients - API communication
- `@pkmn/dex` - Pokemon data library

---

## Table of Contents

1. [Query Hooks Pattern](#query-hooks-pattern)
2. [Mutation Hooks Pattern](#mutation-hooks-pattern)
3. [API Client Usage](#api-client-usage)
4. [Query Key Conventions](#query-key-conventions)
5. [Error Handling](#error-handling)
6. [Loading States](#loading-states)
7. [Cache Management](#cache-management)
8. [Authentication & Token Retry](#authentication--token-retry)
9. [Server-Side Prefetch with HydrationBoundary](#server-side-prefetch-with-hydrationboundary)

---

## Query Hooks Pattern

### Standard Query Hook Structure

**Template**:
```typescript
import { useQuery } from '@tanstack/react-query';

// 1. Define options interface
export interface UseResourceOptions {
  generation?: number;
  enabled?: boolean;
}

// 2. Export query key helper
export const getQueryKey = (
  id: string,
  options: UseResourceOptions = {}
) => {
  return ['resource-name', id, options];
};

// 3. Define the hook
export const useResource = (
  id: string,
  options: UseResourceOptions = {}
) => {
  return useQuery({
    queryKey: getQueryKey(id, options),
    queryFn: () => fetchResource(id, options),
    enabled: options.enabled ?? !!id,
    staleTime: 60 * 1000,  // 1 minute
  });
};
```

### Real Example: Pokemon Details

```typescript
// packages/frontend/dex-data-provider/src/lib/hooks/pokemon-details.hook.ts
import { getPokemonDetails } from '../api/pokemon-dex.api';
import { type GenerationNum, type ID } from '@pkmn/dex';
import { useQuery } from '@tanstack/react-query';

export interface PokemonDetailsOptions {
  generation?: GenerationNum;
}

export const getQueryKey = (
  id?: ID,
  options: PokemonDetailsOptions = { generation: 9 }
) => {
  return [
    'pokedex-search',
    id,
    { provider: 'PkmnDex', type: 'Core', ...options },
  ];
};

export const usePokemonDetails = (
  id?: ID,
  options: PokemonDetailsOptions = { generation: 9 }
) => {
  return useQuery({
    queryKey: getQueryKey(id, options),
    queryFn: () => getPokemonDetails(id as ID, options.generation),
    enabled: !!id,
  });
};
```

**Usage**:
```typescript
const { data, isLoading, error } = usePokemonDetails('pikachu', {
  generation: 1
});

if (isLoading) return <Skeleton />;
if (error) return <Error />;
if (!data) return null;

return <PokemonCard pokemon={data} />;
```

---

## Mutation Hooks Pattern

### Standard Mutation Hook Structure

**Template**:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useCreateResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ResourceInput) => createResource(data),
    onSuccess: (data) => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['resources'] });

      // Show success message
      toast.success('Resource created successfully');
    },
    onError: (error) => {
      // Handle error
      console.error('Error creating resource:', error);
      toast.error('Failed to create resource');
    },
  });
};
```

### Real Example: Create Profile

```typescript
// apps/pokehub-app/app/create-profile/useCreateProfile.tsx
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { withAuthRetry } from '@pokehub/frontend/pokehub-data-provider';
import { getFetchClient } from '@pokehub/frontend/shared-data-provider';

export const useCreateProfile = (avatarFile: File | null) => {
  const { data, update } = useAuthSession();

  return useMutation({
    mutationFn: async (profile: ProfileFormData) => {
      // 1. Upload avatar to Azure
      const uploadUrlResponse = await getFetchClient('NEXT_API')
        .fetchThrowsError('/api/generate-upload-url', {
          method: 'POST',
          body: JSON.stringify({
            fileName: avatarFile.name,
            fileType: avatarFile.type,
          }),
        });

      const { uploadUrl } = await uploadUrlResponse.json();

      await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': avatarFile.type,
        },
        body: avatarFile,
      });

      // 2. Save profile to backend
      const { accessToken, user } = data || {};
      const resData = await withAuthRetry(accessToken!, () =>
        getFetchClient('API').fetchThrowsError(`/users/${user!.id}/profile`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            username: profile.username,
            avatar: avatarFile.name,
          }),
        })
      );

      const res = await resData.json();

      // 3. Update session
      await update({
        ...data,
        user: { ...user, username: profile.username, avatarUrl: res.avatar },
      });
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update profile');
      console.error('Error creating profile:', error);
    },
  });
};
```

**Usage**:
```typescript
const mutation = useCreateProfile(avatarFile);

const handleSubmit = (formData: ProfileFormData) => {
  mutation.mutate(formData);
};

<Button disabled={mutation.isPending}>
  {mutation.isPending ? 'Saving...' : 'Save'}
</Button>
```

### Optimistic Updates

```typescript
export const useUpdatePokemon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePokemon,
    onMutate: async (newPokemon) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['pokemon', newPokemon.id] });

      // Snapshot previous value
      const previousPokemon = queryClient.getQueryData(['pokemon', newPokemon.id]);

      // Optimistically update
      queryClient.setQueryData(['pokemon', newPokemon.id], newPokemon);

      // Return context with snapshot
      return { previousPokemon };
    },
    onError: (err, newPokemon, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['pokemon', newPokemon.id],
        context?.previousPokemon
      );
    },
    onSettled: (newPokemon) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['pokemon', newPokemon.id] });
    },
  });
};
```

---

## API Client Usage

### Fetch Clients

PokeHub has two fetch clients:

1. **`API`** - Backend API (`http://localhost:3000/api`)
2. **`NEXT_API`** - Next.js API routes (`/api`)

**Location**: `@pokehub/frontend/shared-data-provider`

### Getting a Client

```typescript
import { getFetchClient } from '@pokehub/frontend/shared-data-provider';

const apiClient = getFetchClient('API');
const nextApiClient = getFetchClient('NEXT_API');
```

### fetchApi vs fetchThrowsError

**`fetchApi`** - Returns response (doesn't throw):
```typescript
const response = await getFetchClient('API').fetchApi('/users/123');

if (!response.ok) {
  const error = await response.json();
  console.error('Error:', error);
}

const data = await response.json();
```

**`fetchThrowsError`** - Throws on error (preferred for most cases):
```typescript
try {
  const response = await getFetchClient('API')
    .fetchThrowsError('/users/123', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

  const data = await response.json();
} catch (error) {
  if (error instanceof FetchApiError) {
    console.error('API Error:', error.status, error.message);
  }
}
```

### Making Requests

**GET Request**:
```typescript
const response = await getFetchClient('API')
  .fetchThrowsError('/users/123', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

const user = await response.json();
```

**POST Request**:
```typescript
const response = await getFetchClient('API')
  .fetchThrowsError('/users', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ username: 'pikachu' }),
  });

const newUser = await response.json();
```

**HEAD Request** (for existence checks):
```typescript
try {
  await getFetchClient('API')
    .fetchThrowsError(`/users/${username}?dataType=username`, {
      method: 'HEAD',
      headers: { Authorization: `Bearer ${token}` },
    });

  // User exists (200)
  return true;
} catch (error) {
  // User doesn't exist (404)
  return false;
}
```

### Automatic Features

All fetch clients automatically:
- Add `Content-Type: application/json`
- Add `x-traceId` header (UUID for request tracking)
- Handle errors consistently

---

## Query Key Conventions

### Structure

Query keys follow a hierarchical structure:

```typescript
[resource, identifier, options]
```

### Examples

```typescript
// Pokemon details
['pokedex-search', 'pikachu', { provider: 'PkmnDex', type: 'Core', generation: 1 }]

// Pokemon learnset
['pokedex-search', 'pikachu', { type: 'Learnset', provider: 'PkmnDex', generation: 1 }]

// User data
['users', userId, { queryType: 'details' }]

// Username availability
['users', username, { queryType: 'availability', dataType: 'username' }]
```

### Best Practices

1. **Always export the query key function**:
   ```typescript
   export const getQueryKey = (id: string, options = {}) => {
     return ['resource', id, options];
   };
   ```

2. **Include all parameters that affect the data**:
   ```typescript
   // Good
   ['pokemon', id, { generation: 1, forme: 'alola' }]

   // Bad - missing generation
   ['pokemon', id]
   ```

3. **Use consistent naming**:
   ```typescript
   // Good - descriptive
   ['pokedex-search', id, { type: 'Core' }]
   ['pokedex-search', id, { type: 'Learnset' }]

   // Bad - unclear
   ['pokemon', id, 'core']
   ['pokemon', id, 'learnset']
   ```

4. **Group related queries**:
   ```typescript
   // All pokemon queries start with 'pokedex-search'
   ['pokedex-search', id, { type: 'Core' }]
   ['pokedex-search', id, { type: 'Learnset' }]
   ['pokedex-search', id, { type: 'Evolution' }]
   ```

---

## Error Handling

### Query Errors

**In Components**:
```typescript
const { data, isLoading, error } = usePokemonDetails('pikachu');

if (error) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error instanceof Error ? error.message : 'An error occurred'}
      </AlertDescription>
    </Alert>
  );
}
```

**With Error Boundaries**:
```typescript
// Set throwOnError for specific queries
const { data } = usePokemonDetails('pikachu', {
  throwOnError: true,  // Will be caught by error boundary
});

// In parent component
<ErrorBoundary fallback={<ErrorPage />}>
  <PokemonDetails />
</ErrorBoundary>
```

### Mutation Errors

**With onError callback**:
```typescript
const mutation = useMutation({
  mutationFn: createProfile,
  onError: (error) => {
    if (error instanceof FetchApiError) {
      if (error.status === 409) {
        toast.error('Username already taken');
      } else if (error.status === 400) {
        toast.error('Invalid input');
      } else {
        toast.error('Something went wrong');
      }
    }
    console.error('Mutation error:', error);
  },
});
```

**Try-catch with mutateAsync**:
```typescript
const mutation = useMutation({ mutationFn: createProfile });

const handleSubmit = async (data) => {
  try {
    await mutation.mutateAsync(data);
    router.push('/dashboard');
  } catch (error) {
    if (error instanceof FetchApiError) {
      console.error('Error:', error.status);
    }
  }
};
```

### Custom Error Class

```typescript
import { FetchApiError } from '@pokehub/frontend/shared-data-provider';

// Thrown automatically by fetchThrowsError
if (!response.ok) {
  throw new FetchApiError(errorMessage, response.status);
}

// Catch and handle
try {
  await fetchData();
} catch (error) {
  if (error instanceof FetchApiError) {
    console.log('Status:', error.status);
    console.log('Message:', error.message);
  }
}
```

---

## Loading States

### Query Loading

**Simple loading**:
```typescript
const { data, isLoading } = usePokemonDetails('pikachu');

if (isLoading) {
  return <Skeleton className="h-20 w-full" />;
}

return <PokemonCard pokemon={data} />;
```

**Initial vs Refetch loading**:
```typescript
const { data, isLoading, isFetching } = usePokemonDetails('pikachu');

// isLoading: true only on first fetch
// isFetching: true on first fetch AND refetches

if (isLoading) {
  return <Skeleton />;
}

return (
  <div>
    {isFetching && <Spinner className="absolute top-2 right-2" />}
    <PokemonCard pokemon={data} />
  </div>
);
```

**Multiple loading states**:
```typescript
const {
  data,
  isLoading,      // Initial load
  isFetching,     // Any fetch
  isRefetching,   // Refetch with existing data
  isPending,      // Same as isLoading
} = useQuery(...);
```

### Mutation Loading

```typescript
const mutation = useMutation({ mutationFn: updateProfile });

<Button disabled={mutation.isPending}>
  {mutation.isPending ? 'Saving...' : 'Save'}
</Button>

// Or with icons
<Button disabled={mutation.isPending}>
  {mutation.isPending ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Saving...
    </>
  ) : (
    'Save'
  )}
</Button>
```

### Skeleton Patterns

**List skeleton**:
```typescript
{isLoading ? (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
) : (
  <div>
    {data.map(item => <Item key={item.id} data={item} />)}
  </div>
)}
```

**Card skeleton**:
```typescript
{isLoading ? (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
    </CardHeader>
    <CardContent className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </CardContent>
  </Card>
) : (
  <PokemonCard pokemon={data} />
)}
```

---

## Cache Management

### Global Cache Settings

**Location**: `packages/frontend/shared-query-client-provider/src/lib/query-client.provider.tsx`

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,  // 1 minute (SSR optimization)
    },
  },
});
```

### Invalidating Queries

**After mutation**:
```typescript
const mutation = useMutation({
  mutationFn: createPokemon,
  onSuccess: () => {
    // Invalidate all pokemon queries
    queryClient.invalidateQueries({ queryKey: ['pokemon'] });

    // Invalidate specific pokemon
    queryClient.invalidateQueries({ queryKey: ['pokemon', newPokemon.id] });
  },
});
```

**Manual invalidation**:
```typescript
const queryClient = useQueryClient();

const handleRefresh = () => {
  queryClient.invalidateQueries({ queryKey: ['pokemon'] });
};
```

### Prefetching

**Prefetch on hover**:
```typescript
const queryClient = useQueryClient();

const prefetchPokemon = (id: string) => {
  queryClient.prefetchQuery({
    queryKey: ['pokemon', id],
    queryFn: () => fetchPokemon(id),
  });
};

<Link
  href={`/pokemon/${id}`}
  onMouseEnter={() => prefetchPokemon(id)}
>
  View Pokemon
</Link>
```

**Prefetch on mount**:
```typescript
useEffect(() => {
  nextPokemonIds.forEach(id => {
    queryClient.prefetchQuery({
      queryKey: ['pokemon', id],
      queryFn: () => fetchPokemon(id),
    });
  });
}, [nextPokemonIds]);
```

### Setting Query Data Manually

```typescript
const queryClient = useQueryClient();

// After successful mutation
queryClient.setQueryData(
  ['pokemon', pokemonId],
  (oldData) => ({
    ...oldData,
    ...newData,
  })
);
```

---

## Authentication & Token Retry

### withAuthRetry Pattern

**Purpose**: Automatically retry requests with fresh token on 401.

**Location**: `@pokehub/frontend/pokehub-data-provider`

**Implementation**:
```typescript
export const withAuthRetry = async <Data>(
  accessToken: string,
  request: (accessToken: string) => Promise<FetchResponse<Data>>
): Promise<FetchResponse<Data>> => {
  try {
    return await request(accessToken);
  } catch (error) {
    if ((error as FetchApiError).status === 401) {
      // Token expired, get fresh one
      const session = await getAuthSession();

      if (!session?.accessToken) {
        throw new FetchApiError('Unauthorized', 401);
      }

      // Retry with fresh token
      return await request(session.accessToken);
    }
    throw error;
  }
};
```

**Usage**:
```typescript
import { withAuthRetry } from '@pokehub/frontend/pokehub-data-provider';

const { data: session } = useAuthSession();

const { data } = useQuery({
  queryKey: ['protected-data'],
  queryFn: () => withAuthRetry(
    session!.accessToken,
    (token) => getFetchClient('API').fetchThrowsError('/protected', {
      headers: { Authorization: `Bearer ${token}` }
    })
  ),
  enabled: !!session?.accessToken,
});
```

**In mutations**:
```typescript
const mutation = useMutation({
  mutationFn: async (data) => {
    const response = await withAuthRetry(
      accessToken,
      (token) => getFetchClient('API').fetchThrowsError('/users/profile', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      })
    );
    return await response.json();
  },
});
```

---

## Common Patterns

### Dependent Queries

```typescript
// Fetch user first
const { data: user } = useUser(userId);

// Then fetch user's teams (only if user exists)
const { data: teams } = useUserTeams(user?.id, {
  enabled: !!user?.id,
});
```

### Parallel Queries

```typescript
// Fetch multiple resources in parallel
const pokemon = usePokemonDetails('pikachu');
const learnset = usePokemonLearnset('pikachu');
const evolution = usePokemonEvolution('pikachu');

if (pokemon.isLoading || learnset.isLoading || evolution.isLoading) {
  return <Loading />;
}
```

### Infinite Queries

```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['pokemon', filters],
  queryFn: ({ pageParam = 0 }) => fetchPokemon({ offset: pageParam, ...filters }),
  getNextPageParam: (lastPage, pages) => {
    if (lastPage.hasMore) {
      return pages.length * 20;  // Next offset
    }
    return undefined;
  },
});

<InfiniteScroll
  loadMore={fetchNextPage}
  hasMore={hasNextPage}
  loading={isFetchingNextPage}
>
  {data?.pages.flatMap(page => page.items).map(pokemon => (
    <PokemonCard key={pokemon.id} pokemon={pokemon} />
  ))}
</InfiniteScroll>
```

### Polling

```typescript
const { data } = useQuery({
  queryKey: ['battle-status', battleId],
  queryFn: () => fetchBattleStatus(battleId),
  refetchInterval: 2000,  // Poll every 2 seconds
  enabled: battleActive,   // Only poll while battle active
});
```

---

## Quick Reference

### Query Hook Template

```typescript
export const useResource = (id: string, options = {}) => {
  return useQuery({
    queryKey: ['resource', id, options],
    queryFn: () => fetchResource(id, options),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
};
```

### Mutation Hook Template

```typescript
export const useCreateResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createResource(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast.success('Success');
    },
    onError: (error) => {
      toast.error('Error');
      console.error(error);
    },
  });
};
```

### API Call Template

```typescript
const response = await getFetchClient('API')
  .fetchThrowsError('/endpoint', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

const result = await response.json();
```

### Auth Retry Template

```typescript
const response = await withAuthRetry(
  accessToken,
  (token) => getFetchClient('API').fetchThrowsError('/protected', {
    headers: { Authorization: `Bearer ${token}` },
  })
);
```

---

## Server-Side Prefetch with HydrationBoundary

### Overview

For pages that need data immediately on load, use server-side prefetching with React Query's `HydrationBoundary`. This pattern:
- Fetches data on the server during SSR
- Dehydrates the cache state and sends it to the client
- Hydrates the client-side cache with prefetched data
- Eliminates loading states on initial render

### When to Use

- Pages where data is critical for initial render
- Authenticated pages where you have the session on the server
- Lists or dashboards that should display immediately
- Avoiding client-side request waterfalls

### Implementation Pattern

**Server Component (Page)**:
```typescript
// app/team-builder/page.tsx
import { auth } from '@pokehub/frontend/shared-auth/server';
import { getQueryClient } from '@pokehub/frontend/shared-data-provider';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getUserTeams, teamsKeys } from '@pokehub/frontend/pokehub-team-builder';
import { redirect } from 'next/navigation';

export default async function TeamBuilderPage() {
  // 1. Get session on server
  const session = await auth();

  if (!session?.accessToken) {
    redirect('/login');
  }

  // 2. Create query client for this request
  const queryClient = getQueryClient();

  // 3. Prefetch data using same query key as client hook
  await queryClient.prefetchQuery({
    queryKey: teamsKeys.all,
    queryFn: () => getUserTeams(session.accessToken),
  });

  // 4. Wrap client components with HydrationBoundary
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeamViewerProvider>
        <TeamViewer />
      </TeamViewerProvider>
    </HydrationBoundary>
  );
}
```

**Client Component (Hook)**:
```typescript
// hooks/useTeams.ts
export function useUserTeams() {
  const { data: session } = useAuthSession();

  return useQuery({
    queryKey: teamsKeys.all,  // Same key as prefetch!
    queryFn: async () => {
      const { accessToken } = session || {};
      if (!accessToken) throw new Error('Access token is required');
      return getUserTeams(accessToken);
    },
    enabled: !!session?.accessToken,
    staleTime: 30000, // 30 seconds
  });
}
```

### Key Requirements

1. **Same Query Key**: The `queryKey` in `prefetchQuery` MUST match the client hook's `queryKey`
2. **Export API Function**: The data fetching function (e.g., `getUserTeams`) must be callable from both server and client
3. **Server-Side Auth**: Use `auth()` from server auth package, not client hooks
4. **Dehydrate State**: Always wrap with `dehydrate(queryClient)` to serialize the cache

### Benefits

| Without Prefetch | With Prefetch |
|-----------------|---------------|
| Page loads → Loading spinner → Data fetches → Content renders | Page loads → Content renders immediately |
| 2+ network round trips | 1 network round trip (during SSR) |
| Layout shift when content loads | No layout shift |
| Visible loading state | No loading state on initial render |

### Real Example: Team Viewer

```typescript
// app/team-builder/page.tsx
export default async function TeamBuilderPage() {
  const session = await auth();

  if (!session?.accessToken) {
    redirect('/login');
  }

  const queryClient = getQueryClient();

  // Prefetch teams data on server
  await queryClient.prefetchQuery({
    queryKey: teamsKeys.all,
    queryFn: () => getUserTeams(session.accessToken),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeamViewerProvider>
        <TeamViewer />
      </TeamViewerProvider>
    </HydrationBoundary>
  );
}
```

The `TeamViewer` component uses `useUserTeams()` which automatically picks up the prefetched data—no loading state, instant render.

### Common Mistakes

**❌ Different query keys**:
```typescript
// Server
await queryClient.prefetchQuery({
  queryKey: ['teams'],  // Wrong!
  queryFn: () => getUserTeams(token),
});

// Client
useQuery({
  queryKey: teamsKeys.all,  // ['teams', 'all'] - Different key!
  queryFn: () => getUserTeams(token),
});
```

**✅ Same query keys**:
```typescript
// Server
await queryClient.prefetchQuery({
  queryKey: teamsKeys.all,  // Use the same key helper
  queryFn: () => getUserTeams(token),
});

// Client
useQuery({
  queryKey: teamsKeys.all,  // Same key!
  queryFn: () => getUserTeams(token),
});
```

**❌ Forgetting HydrationBoundary**:
```typescript
// This won't work - data won't transfer to client
return <TeamViewer />;
```

**✅ With HydrationBoundary**:
```typescript
return (
  <HydrationBoundary state={dehydrate(queryClient)}>
    <TeamViewer />
  </HydrationBoundary>
);
```

---

## Checklist

When creating a new data fetching hook:

- [ ] Define options interface (if needed)
- [ ] Export `getQueryKey` function
- [ ] Use consistent query key structure
- [ ] Handle `enabled` flag properly
- [ ] Set appropriate `staleTime`
- [ ] Handle loading states
- [ ] Handle error states
- [ ] Add toast notifications for mutations
- [ ] Invalidate related queries after mutations
- [ ] Use `withAuthRetry` for authenticated requests
- [ ] Export TypeScript types
