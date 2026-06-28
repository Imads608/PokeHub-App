---
name: new-component
description: Create a React component or feature in the PokeHub frontend following its shadcn/CVA + TanStack Query + App Router conventions. Use when the user asks to build a UI component, page, feature, or data-fetching hook on the frontend.
---

# Build a PokeHub frontend component

Follow the established patterns exactly — this app has strong conventions.

## First: locate the pattern (graphify)

Before writing, query **graphify** to ground yourself in what already exists — don't rely on the
package/file names in this doc, which can drift:
- What does `@pokehub/frontend/shared-ui-components` actually export today? (avoid re-adding a primitive)
- Is there an existing component/hook doing something similar to copy from?
- Which data-provider lib owns the query hooks for this domain?

The rules below are the prescriptive part; graphify supplies the current locational facts.

## Hard rules (from CLAUDE.md)

- **Never use raw HTML primitives** (`<button>`, `<input>`, `<dialog>`, `<select>`…) when a
  shared component exists. Import from `@pokehub/frontend/shared-ui-components` (Button, Card,
  Tabs, Dialog, Input, Select, ScrollArea, Badge, Tooltip, …).
- If a needed primitive isn't exported yet, add it to `shared-ui-components` first
  (it's shadcn/ui based — copy from https://ui.shadcn.com/ then re-export from its `src/index.ts`).
- Merge Tailwind classes with `cn()` from `@pokehub/frontend/shared-ui-components`, never string
  concatenation that can produce conflicting classes.
- Use **Next.js `<Image>`** (not `<img>`) and **`next/link`** for navigation.
- Use **lucide-react** for icons.

## Where code goes

- **Reusable domain components** → a `packages/frontend/*` library (e.g. `pokehub-dex-components`).
  Use `/new-package` if a suitable lib doesn't exist.
- **App-specific pages/routes** → `apps/pokehub-app/app/...` (App Router).

## `'use client'` boundary

| File | Directive | Why |
|------|-----------|-----|
| `app/layout.tsx`, `app/page.tsx` | server (none) | metadata, static content |
| Provider wrappers, anything using hooks/state/context/effects | `'use client'` | interactivity |
| Most feature/domain components | `'use client'` | they use Query hooks + context |

Add `'use client'` at the very top of any component that uses `useState`, `useEffect`,
`useQuery`, `useContext`, or event handlers.

## Component shape (CVA + forwardRef for shared primitives)

Shared UI primitives use `class-variance-authority` + Radix `Slot` + `forwardRef` — see
`packages/frontend/shared-ui-components/src/lib/button/button.tsx`. Domain components are simpler:

```tsx
'use client';

import { Button, Card, cn } from '@pokehub/frontend/shared-ui-components';
import { Swords } from 'lucide-react';

export interface TeamSummaryCardProps {
  teamId: string;
  className?: string;
}

export function TeamSummaryCard({ teamId, className }: TeamSummaryCardProps) {
  return (
    <Card className={cn('rounded-xl bg-background p-6', className)}>
      {/* ... */}
    </Card>
  );
}
```

## Data fetching — TanStack Query

Hooks live in data-provider libs (e.g. `dex-data-provider`). Export a `getQueryKey` helper and
gate the query with `enabled`:

```ts
import { useQuery } from '@tanstack/react-query';

// Query key convention: [domain, resourceId, { provider, type, ...options }]
export const getQueryKey = (id?: string) =>
  ['teams', id, { provider: 'PokehubApi', type: 'Core' }];

export const useTeam = (id?: string) =>
  useQuery({
    queryKey: getQueryKey(id),
    queryFn: () => getTeam(id!),
    enabled: !!id,
  });
```

Network calls go through the shared fetch client (`@pokehub/frontend/shared-data-provider`,
`getFetchClient('API')`), not raw `fetch`, so tracing headers are attached.

## Theming & Pokemon type colors

- Dark mode is class-based (`darkMode: ['class']`); use `dark:` variants and semantic color
  tokens (`bg-background`, `text-muted-foreground`, `bg-primary`) — never hard-coded hex.
- For type-colored UI, use `typeColors` / `typeMoveStyles` from `@pokehub/frontend/shared-utils`,
  or the `PokemonTypeBadge` component.

## Forms — React Hook Form + shared form components

Use `@pokehub/frontend/shared-form-components` (`FormFieldInput`, etc.) wired with `useForm`'s
`control`. Validation rules live in the field controller; Zod schemas come from `shared/*-models`.

## Finish with a test

Co-locate `<name>.spec.tsx` next to the component. Wrap renders in a `QueryClientProvider` with
retries disabled. See `/ci-check` and the testing pattern in
`apps/pokehub-app/app/create-profile/profile.spec.tsx`. Then run `npx nx test <project>`.
