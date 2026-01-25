# Code Style & Patterns Guide

## Overview

This guide documents the coding conventions, patterns, and best practices used throughout the PokeHub codebase. Following these guidelines ensures consistency, maintainability, and ease of collaboration.

**Philosophy**: Write code that is:

- **Consistent**: Follows established patterns
- **Readable**: Easy to understand at a glance
- **Type-Safe**: Leverages TypeScript fully
- **Maintainable**: Easy to modify and extend

---

## File Naming Conventions

### General Rules

- **Use kebab-case** for all files and directories
- **Be descriptive** but concise
- **Group related files** in directories

### File Suffixes

| File Type            | Suffix                      | Example                   |
| -------------------- | --------------------------- | ------------------------- |
| React Component      | `.tsx`                      | `pokemon-card.tsx`        |
| TypeScript file      | `.ts`                       | `pokemon-utils.ts`        |
| Hook                 | `.hook.ts` or `.tsx`        | `pokemon-details.hook.ts` |
| Context              | `.context.tsx`              | `team-editor.context.tsx` |
| Provider             | `.provider.tsx`             | `auth.provider.tsx`       |
| Model/Types          | `.models.ts` or `.types.ts` | `profile.models.ts`       |
| Test                 | `.spec.ts` or `.spec.tsx`   | `button.spec.tsx`         |
| API Client           | `.api.ts`                   | `pokemon-dex.api.ts`      |
| Service (Backend)    | `.service.ts`               | `auth.service.ts`         |
| Controller (Backend) | `.controller.ts`            | `users.controller.ts`     |
| Module (Backend)     | `.module.ts`                | `auth.module.ts`          |
| Guard (Backend)      | `.guard.ts`                 | `token-auth.guard.ts`     |
| Decorator (Backend)  | `.decorator.ts`             | `user.decorator.ts`       |

### Examples

**Good**:

```
pokemon-details.hook.ts
team-editor.context.tsx
searchable-select.tsx
user-profile.models.ts
pokemon-dex.api.ts
```

**Bad**:

```
PokemonDetails.hook.ts          // PascalCase
pokemon_details.hook.ts         // snake_case
pokemonDetailsHook.ts           // camelCase
pokemon-details.ts              // Missing .hook suffix
```

### Directory Naming

- **Use kebab-case** for directories
- **Plural for collections**: `components/`, `hooks/`, `utils/`
- **Singular for single purpose**: `context/`, `api/`

**Examples**:

```
components/
  pokemon/
    tabs/
      stats/
        stats-tab.tsx
        stats-card.tsx
        type-effectiveness-card.tsx
hooks/
  pokemon-details.hook.ts
  pokemon-learnset.hook.ts
context/
  team-editor.context.tsx
```

---

## Import Organization

### Import Order

1. **React/Next.js** (if used)
2. **External dependencies** (npm packages)
3. **@pokehub packages** (alphabetical by scope)
4. **Relative imports** (parent → sibling → child)

### Example

```typescript
// 1. React/Next.js
// 4. Relative imports
import { useTeamEditorContext } from '../../context/team-editor.context';
import { SearchableSelect } from './searchable-select';
// 3. @pokehub packages (alphabetical by package name)
import { getPokemonDetails } from '@pokehub/frontend/dex-data-provider';
import { PokemonInTeam } from '@pokehub/frontend/pokemon-types';
import { Button, Input, Label } from '@pokehub/frontend/shared-ui-components';
import { cn } from '@pokehub/frontend/shared-utils';
// 2. External dependencies (alphabetical)
import { useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
```

### Type Imports

Use the `type` keyword for type-only imports:

```typescript
// Good
import type { User } from '@pokehub/shared/shared-user-models';
import type { GenerationNum, ID } from '@pkmn/dex';

// Bad
import { User } from '@pokehub/shared/shared-user-models';
import { GenerationNum, ID } from '@pkmn/dex';
```

**Why**: Makes it clear what's a type vs value, helps with tree-shaking.

### Path Aliases

Always use path aliases defined in `tsconfig.base.json`:

```typescript
// Good
import { Button } from '@pokehub/frontend/shared-ui-components';
import { UserCore } from '@pokehub/shared/shared-user-models';

// Bad
import { Button } from '../../../../packages/frontend/shared-ui-components/src';
import { UserCore } from '../../../shared/shared-user-models/src';
```

### Server-Only Imports

Some packages have server-only exports:

```typescript
// Client-side
import { useAuthSession } from '@pokehub/frontend/shared-auth';
// Server-side (Next.js server components/API routes)
import { getServerSession } from '@pokehub/frontend/shared-auth/server';
```

---

## TypeScript Conventions

### Type vs Interface

**Use `interface` for**:

- Component props
- Object shapes
- Public APIs

**Use `type` for**:

- Unions
- Intersections
- Primitives
- Mapped types
- Utility types

```typescript
// Good - Interface for props
export interface BasicTabProps {
  pokemon: PokemonInTeam;
  species: Species;
}

// Good - Type for union
export type UserAccountRole = 'ADMIN' | 'USER';

// Good - Type for intersection
export type PokemonWithStats = Pokemon & { stats: Stats[] };
```

### Naming Conventions

| Type       | Convention                    | Example                                   |
| ---------- | ----------------------------- | ----------------------------------------- |
| Interface  | PascalCase                    | `UserProfile`, `PokemonDetailsOptions`    |
| Type Alias | PascalCase                    | `UserAccountRole`, `TokenType`            |
| Enum       | PascalCase                    | `AccountRole`, `TokenType`                |
| Variable   | camelCase                     | `userId`, `pokemonDetails`                |
| Constant   | UPPER_SNAKE_CASE or camelCase | `MAX_TEAM_SIZE` or `defaultGeneration`    |
| Function   | camelCase                     | `getPokemonDetails`, `usePokemonLearnset` |
| Component  | PascalCase                    | `BasicTab`, `PokemonCard`                 |
| Hook       | camelCase starting with `use` | `usePokemonDetails`, `useCreateProfile`   |

### Explicit Return Types

**Always specify return types** for:

- Public functions
- Exported functions
- Complex functions

```typescript
// Good
export const getPokemonDetails = (
  id: ID,
  generation?: GenerationNum
): Pokemon => {
  // ...
};

export const useAuthSession = (): TypedSessionReturn => {
  // ...
};

// Acceptable for simple inline functions
const handleClick = () => {
  console.log('clicked');
};
```

### Avoid `any`

Use `unknown` instead of `any` when the type is truly unknown:

```typescript
// Bad
const handleError = (error: any) => {
  console.error(error.message);
};

// Good
const handleError = (error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message);
  }
};
```

### Type Assertions

Use `as` sparingly and only when you have additional information TypeScript doesn't:

```typescript
// Acceptable
setAbility(value as AbilityName);

// Better - use type guard
if (isAbilityName(value)) {
  setAbility(value);
}
```

---

## React Component Patterns

### Component Structure

```typescript
// 1. Imports
import { useState } from 'react';
import type { ReactNode } from 'react';

// 2. Type/Interface definitions
export interface ComponentProps {
  title: string;
  children?: ReactNode;
  onSubmit?: () => void;
}

// 3. Component definition
export const MyComponent = ({ title, children, onSubmit }: ComponentProps) => {
  // 4. Hooks (in order: context, state, effects, queries/mutations)
  const { user } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // ...
  }, []);

  const { data } = usePokemonDetails(pokemonId);

  // 5. Event handlers
  const handleSubmit = () => {
    onSubmit?.();
  };

  // 6. Render helpers (if needed)
  const renderContent = () => {
    return <div>{children}</div>;
  };

  // 7. Return JSX
  return (
    <div>
      <h1>{title}</h1>
      {renderContent()}
    </div>
  );
};
```

### Named vs Default Exports

**Always use named exports** for components:

```typescript
// Good
export const PokemonCard = () => { ... };

// Bad
export default function PokemonCard() { ... }
const PokemonCard = () => { ... };
export default PokemonCard;
```

**Exception**: Next.js pages MUST use default exports:

```typescript
// app/pokedex/page.tsx
export default async function PokedexPage() {
  return <PokedexComponent />;
}
```

### Props Interface

Define props interface directly above the component:

```typescript
export interface PokemonCardProps {
  pokemon: Pokemon;
  onClick?: (id: string) => void;
  className?: string;
}

export const PokemonCard = ({
  pokemon,
  onClick,
  className,
}: PokemonCardProps) => {
  // ...
};
```

### Optional Props

Use optional chaining and nullish coalescing:

```typescript
// Good
export const Component = ({ onSubmit, title }: ComponentProps) => {
  const handleClick = () => {
    onSubmit?.(); // Optional chaining
  };

  return <h1>{title ?? 'Default Title'}</h1>; // Nullish coalescing
};

// Bad
export const Component = ({ onSubmit, title }: ComponentProps) => {
  const handleClick = () => {
    if (onSubmit) {
      onSubmit();
    }
  };

  return <h1>{title || 'Default Title'}</h1>; // Wrong for empty strings
};
```

### Component Composition

Prefer composition over prop drilling:

```typescript
// Good - Composition
<Card>
  <CardHeader>
    <CardTitle>Pokemon Details</CardTitle>
  </CardHeader>
  <CardContent>
    <PokemonStats pokemon={pokemon} />
  </CardContent>
</Card>

// Bad - Too many props
<Card
  title="Pokemon Details"
  content={<PokemonStats pokemon={pokemon} />}
  hasHeader
  headerAlign="left"
/>
```

### Conditional Rendering

```typescript
// Simple condition - use &&
{
  isLoading && <Spinner />;
}

// Binary condition - use ternary
{
  isLoading ? <Spinner /> : <Content />;
}

// Multiple conditions - use separate variables or early returns
const renderContent = () => {
  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  if (!data) return <Empty />;
  return <Content data={data} />;
};

return <div>{renderContent()}</div>;
```

### Client vs Server Components (Next.js)

```typescript
import { useState } from 'react';

// Server Component (default in app directory)
// - No 'use client' directive
// - Can use async/await
// - Can access backend directly
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// Client Component
// - Has 'use client' directive
// - Can use hooks (useState, useEffect, etc.)
// - Can use event handlers
('use client');

export const InteractiveComponent = () => {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
};
```

---

## Custom Hooks Patterns

### Hook Structure

```typescript
// 1. Imports
import { useQuery } from '@tanstack/react-query';

// 2. Options interface (if needed)
export interface UsePokemonDetailsOptions {
  generation?: GenerationNum;
}

// 3. Query key helper (for TanStack Query hooks)
export const getQueryKey = (
  id?: ID,
  options: UsePokemonDetailsOptions = {}
) => {
  return ['pokemon-details', id, options];
};

// 4. Hook definition
export const usePokemonDetails = (
  id?: ID,
  options: UsePokemonDetailsOptions = {}
) => {
  return useQuery({
    queryKey: getQueryKey(id, options),
    queryFn: () => getPokemonDetails(id!, options.generation),
    enabled: !!id,
  });
};
```

### Hook Naming

- Start with `use`
- Be specific about what it does
- Follow camelCase

```typescript
// Good
usePokemonDetails;
useCreateProfile;
useAuthSession;
useDebouncedSearch;

// Bad
pokemonDetails; // Missing 'use'
usePokemon; // Too vague
use_pokemon_data; // snake_case
```

### Custom Hook Rules

1. **Always start with `use`**
2. **Can call other hooks** (useState, useEffect, etc.)
3. **Return data consistently**

```typescript
// Good - Consistent return pattern
export const useToggle = (initialValue = false) => {
  const [value, setValue] = useState(initialValue);
  const toggle = () => setValue(!value);
  return [value, toggle] as const;
};

// Also good - Object return
export const useToggle = (initialValue = false) => {
  const [value, setValue] = useState(initialValue);
  const toggle = () => setValue(!value);
  return { value, toggle, setValue };
};
```

---

## State Management Patterns

### Local State (useState)

Use for component-specific state:

```typescript
export const Component = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ...
};
```

### Context (React Context)

Use for shared state across component tree:

```typescript
// 1. Create context
interface TeamEditorContextValue {
  activePokemon: PokemonInTeam | null;
  setActivePokemon: (pokemon: PokemonInTeam) => void;
}

const TeamEditorContext = createContext<TeamEditorContextValue | undefined>(
  undefined
);

// 2. Create provider
export const TeamEditorProvider = ({ children }: { children: ReactNode }) => {
  const [activePokemon, setActivePokemon] = useState<PokemonInTeam | null>(
    null
  );

  const value = useMemo(
    () => ({ activePokemon, setActivePokemon }),
    [activePokemon]
  );

  return (
    <TeamEditorContext.Provider value={value}>
      {children}
    </TeamEditorContext.Provider>
  );
};

// 3. Create custom hook
export const useTeamEditorContext = () => {
  const context = useContext(TeamEditorContext);
  if (!context) {
    throw new Error(
      'useTeamEditorContext must be used within TeamEditorProvider'
    );
  }
  return context;
};
```

### Server State (TanStack Query)

Use for API data:

```typescript
// Query (GET)
const { data, isLoading, error } = useQuery({
  queryKey: ['pokemon', pokemonId],
  queryFn: () => fetchPokemon(pokemonId),
});

// Mutation (POST/PUT/DELETE)
const { mutate, isPending } = useMutation({
  mutationFn: (data: ProfileData) => updateProfile(data),
  onSuccess: () => {
    toast.success('Profile updated');
  },
  onError: (error) => {
    toast.error('Failed to update profile');
  },
});
```

---

## Styling Patterns

### Tailwind CSS

**Primary styling approach**: Utility-first with Tailwind CSS.

```typescript
// Good - Utility classes
<div className="flex items-center gap-2 rounded-md bg-primary p-4 text-white">
  <Icon />
  <span>Text</span>
</div>

// Responsive utilities
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### Class Merging with `cn()`

Use the `cn()` helper to merge classes conditionally:

```typescript
import { cn } from '@pokehub/frontend/shared-utils';

<div
  className={cn(
    'base-class',
    isActive && 'active-class',
    className // Allow prop override
  )}
>
  Content
</div>;
```

### Component Variants (CVA)

For components with multiple variants, use `class-variance-authority`:

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva('base classes here', {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
      outline: 'border border-input bg-background',
    },
    size: {
      default: 'h-10 px-4',
      sm: 'h-9 px-3',
      lg: 'h-11 px-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  // ...
}

export const Button = ({ variant, size, className }: ButtonProps) => {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)}>
      {children}
    </button>
  );
};
```

### Theme Variables

Use CSS variables defined in globals.css:

```typescript
// Good - Uses theme variables
<div className="bg-background text-foreground">
  <h1 className="text-primary">Title</h1>
</div>

// Bad - Hardcoded colors
<div className="bg-white text-black">
  <h1 className="text-blue-500">Title</h1>
</div>
```

**Available theme variables**:

- `background`, `foreground`
- `primary`, `primary-foreground`
- `secondary`, `secondary-foreground`
- `muted`, `muted-foreground`
- `accent`, `accent-foreground`
- `destructive`, `destructive-foreground`
- `border`, `input`, `ring`

---

## Error Handling

### Frontend Error Handling

#### API Errors (TanStack Query)

```typescript
const { data, error } = useQuery({
  queryKey: ['pokemon', id],
  queryFn: () => fetchPokemon(id),
});

if (error) {
  return <ErrorComponent message={error.message} />;
}
```

#### Mutation Errors

```typescript
const mutation = useMutation({
  mutationFn: updateProfile,
  onError: (error) => {
    if (error instanceof FetchApiError) {
      if (error.status === 409) {
        toast.error('Username already taken');
      } else {
        toast.error('Failed to update profile');
      }
    }
    console.error('Error:', error);
  },
});
```

#### Try-Catch for Async Operations

```typescript
const handleSubmit = async () => {
  try {
    await uploadFile(file);
    toast.success('File uploaded');
  } catch (error) {
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error('An unexpected error occurred');
    }
    console.error('Upload error:', error);
  }
};
```

### Backend Error Handling

#### Service Layer

```typescript
import { ServiceError } from '@pokehub/backend/shared-exceptions';

export class UsersService {
  async createUser(email: string) {
    const existing = await this.usersDb.getUserByEmail(email);

    if (existing) {
      throw new ServiceError('BadRequest', 'User already exists');
    }

    // Create user...
  }
}
```

#### Controller Layer

```typescript
import { BadRequestException, NotFoundException } from '@nestjs/common';

@Get(':id')
async getUser(@Param('id') id: string) {
  const user = await this.usersService.getUser(id);

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return user;
}
```

---

## Async/Await Patterns

### Always Use async/await

```typescript
// Good
const fetchData = async () => {
  const response = await fetch('/api/data');
  const data = await response.json();
  return data;
};

// Bad - Promise chains
const fetchData = () => {
  return fetch('/api/data')
    .then((response) => response.json())
    .then((data) => data);
};
```

### Error Handling with async/await

```typescript
// Good
const fetchData = async () => {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error('Failed to fetch');
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

// Also acceptable for mutations
const { mutateAsync } = useMutation({
  mutationFn: updateProfile,
});

const handleSubmit = async () => {
  try {
    await mutateAsync(formData);
    router.push('/team-builder');
  } catch (error) {
    // Error already handled by onError
  }
};
```

---

## Performance Best Practices

### Memoization

Use `useMemo` for expensive computations:

```typescript
const sortedPokemon = useMemo(() => {
  return pokemon.sort((a, b) => a.name.localeCompare(b.name));
}, [pokemon]);
```

Use `useCallback` for functions passed as props:

```typescript
const handleClick = useCallback((id: string) => {
  setSelectedId(id);
}, []);

<ChildComponent onClick={handleClick} />;
```

### React.memo for Component Optimization

```typescript
export const PokemonCard = React.memo(({ pokemon }: PokemonCardProps) => {
  return <div>{pokemon.name}</div>;
});
```

### Avoid Inline Functions in JSX

```typescript
// Bad - Creates new function on every render
<Button onClick={() => setCount(count + 1)}>Increment</Button>;

// Good - Stable function reference
const handleIncrement = () => setCount(count + 1);
<Button onClick={handleIncrement}>Increment</Button>;

// Also good for simple cases
const handleIncrement = () => setCount((c) => c + 1);
<Button onClick={handleIncrement}>Increment</Button>;
```

---

## Testing Patterns

### Component Tests

```typescript
import { Button } from './button';
import { render, screen } from '@testing-library/react';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    screen.getByText('Click me').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Hook Tests

```typescript
import { usePokemonDetails } from './pokemon-details.hook';
import { renderHook } from '@testing-library/react';

describe('usePokemonDetails', () => {
  it('fetches pokemon details', async () => {
    const { result, waitFor } = renderHook(() => usePokemonDetails('pikachu'));

    await waitFor(() => result.current.isSuccess);

    expect(result.current.data).toBeDefined();
    expect(result.current.data.name).toBe('Pikachu');
  });
});
```

---

## Comments & Documentation

### When to Comment

**DO comment**:

- Complex algorithms
- Non-obvious business logic
- Workarounds for bugs
- Public API functions

**DON'T comment**:

- Obvious code
- What the code does (code should be self-documenting)

```typescript
// Bad - Obvious
// Increment count by 1
setCount(count + 1);

// Good - Explains why
// Reset to 0 after 10 to prevent overflow in legacy system
if (count >= 10) {
  setCount(0);
}
```

### JSDoc for Public APIs

```typescript
/**
 * Fetches Pokemon details by ID.
 *
 * @param id - Pokemon ID or name
 * @param options - Optional configuration
 * @returns Pokemon details
 * @throws {Error} If Pokemon not found
 *
 * @example
 * const pokemon = await getPokemonDetails('pikachu', { generation: 1 });
 */
export const getPokemonDetails = async (
  id: ID,
  options?: PokemonDetailsOptions
): Promise<Pokemon> => {
  // ...
};
```

---

## Package Organization

### When to Create a New Package

Create a new package when:

- ✅ Code is reusable across multiple apps
- ✅ Code has a clear, single responsibility
- ✅ Code could be extracted to npm in the future

Don't create a package when:

- ❌ Code is app-specific
- ❌ Package would have only 1-2 files
- ❌ Unclear boundaries

### Package Naming

Pattern: `@pokehub/<scope>/<name>`

**Scopes**:

- `frontend` - React/Next.js packages
- `backend` - NestJS packages
- `shared` - Cross-platform packages

**Examples**:

```
@pokehub/frontend/shared-ui-components
@pokehub/frontend/pokehub-dex-components
@pokehub/backend/shared-auth-utils
@pokehub/shared/shared-user-models
```

---

## Common Anti-Patterns to Avoid

### ❌ Prop Drilling

```typescript
// Bad
<Parent data={data}>
  <Child data={data}>
    <GrandChild data={data}>
      <GreatGrandChild data={data} />
    </GrandChild>
  </Child>
</Parent>

// Good - Use Context
<DataProvider value={data}>
  <Parent>
    <Child>
      <GrandChild>
        <GreatGrandChild />
      </GrandChild>
    </Child>
  </Parent>
</DataProvider>
```

### ❌ Massive Components

```typescript
// Bad - 500+ line component
export const Dashboard = () => {
  // Too much logic, rendering, state...
};

// Good - Break into smaller components
export const Dashboard = () => {
  return (
    <>
      <DashboardHeader />
      <DashboardStats />
      <DashboardContent />
    </>
  );
};
```

### ❌ Mixing Server and Client Code

```typescript
// Bad - Using hooks in server component
export default async function Page() {
  const [count, setCount] = useState(0); // Error!
  return <div>{count}</div>;
}

// Good - Separate server and client
export default async function Page() {
  const data = await fetchData(); // Server
  return <ClientComponent data={data} />;
}

// client-component.tsx
('use client');
export const ClientComponent = ({ data }) => {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
};
```

### ❌ Ignoring TypeScript Errors

```typescript
// Bad
// @ts-ignore
const user = data.user;

// Good - Fix the type issue
const user = data?.user;
```

---

## Code Review Checklist

Before submitting a PR, verify:

- [ ] Files use correct naming conventions (kebab-case, proper suffixes)
- [ ] Imports are organized correctly
- [ ] TypeScript types are properly defined (no `any`)
- [ ] Components use named exports (except Next.js pages)
- [ ] Props interfaces are defined
- [ ] Custom hooks start with `use`
- [ ] Tailwind classes are used for styling
- [ ] Error handling is implemented
- [ ] No console.logs in production code
- [ ] Comments explain "why", not "what"
- [ ] Tests are written for new features
- [ ] Code follows existing patterns in the codebase

---

## Quick Reference

### Component Template

```typescript
import type { ReactNode } from 'react';

export interface MyComponentProps {
  title: string;
  children?: ReactNode;
  onAction?: () => void;
}

export const MyComponent = ({
  title,
  children,
  onAction,
}: MyComponentProps) => {
  // Hooks
  const [state, setState] = useState(initialValue);

  // Event handlers
  const handleAction = () => {
    onAction?.();
  };

  // Render
  return (
    <div className="container">
      <h1>{title}</h1>
      {children}
      <button onClick={handleAction}>Action</button>
    </div>
  );
};
```

### Custom Hook Template

```typescript
import { useQuery } from '@tanstack/react-query';

export interface UseMyDataOptions {
  enabled?: boolean;
}

export const getQueryKey = (id: string, options: UseMyDataOptions = {}) => {
  return ['my-data', id, options];
};

export const useMyData = (id: string, options: UseMyDataOptions = {}) => {
  return useQuery({
    queryKey: getQueryKey(id, options),
    queryFn: () => fetchData(id),
    enabled: options.enabled ?? true,
  });
};
```

### Context Template

```typescript
import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

interface MyContextValue {
  state: string;
  setState: (value: string) => void;
}

const MyContext = createContext<MyContextValue | undefined>(undefined);

export const MyProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState('');

  const value = useMemo(() => ({ state, setState }), [state]);

  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
};

export const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
};
```

---

## Appendix: VSCode Settings

Recommended settings for consistent formatting:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "typescript.updateImportsOnFileMove.enabled": "always"
}
```
