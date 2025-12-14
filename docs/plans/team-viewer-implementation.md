Team Viewer Implementation Plan

Overview

Build out the team viewer page on /team-builder to display, filter, duplicate, and delete Pokemon teams.

User Requirements (Confirmed)

- ✅ Filters: Generation, Format, Team name search, Date created/updated sorting
- ✅ Duplicate: Copy team with "(Copy)" suffix and open in editor immediately
- ✅ View modes: Both grid and list views with toggle
- ✅ Pagination: Load all teams at once (simple approach)

Current State

- TeamViewer component exists but is scaffolded (stub implementation) at /packages/frontend/pokehub-team-builder/src/lib/team-viewer/team-viewer.tsx
- Backend API is complete and tested
- Mutation hooks exist (useCreateTeam, useUpdateTeam, useDeleteTeam)
- Query hook missing - need to add useUserTeams() to fetch all teams

Implementation Steps

1.  Add TanStack Query Hook for Fetching Teams

File: /packages/frontend/pokehub-team-builder/src/lib/hooks/useTeams.ts

Action: Add useUserTeams() hook to fetch all teams

export function useUserTeams() {
const queryClient = useQueryClient();
const { data: session } = useAuthSession();

return useQuery({
queryKey: teamsKeys.all,
queryFn: async (): Promise<TeamResponseDTO[]> => {
const { accessToken } = session || {};
if (!accessToken) throw new Error('Access token is required');
return getUserTeams(accessToken);
},
enabled: !!session?.accessToken,
staleTime: 30000, // 30 seconds
});
}

Key details:

- Uses existing teamsKeys.all for cache management
- Integrates with existing mutation hooks (they already invalidate this cache)
- API client function getUserTeams() already exists in teams-api.ts

---

2.  Create Filter Context Provider

New directory: /packages/frontend/pokehub-team-builder/src/lib/team-viewer/context/

Files to create:

1.  team-viewer.context.model.ts - TypeScript types for filter state
2.  team-viewer.context.ts - Context definition and useTeamViewerFilters() hook
3.  team-viewer.provider.tsx - Provider component with state management

Filter state includes:

- searchTerm: string - Team name search (debounced)
- selectedGeneration: GenerationNum | 'all' - Generation filter
- selectedFormat: string | 'all' - Format filter
- sortBy: 'created' | 'updated' | 'name' - Sort field
- sortOrder: 'asc' | 'desc' - Sort direction
- viewMode: 'grid' | 'list' - View toggle

Pattern: Follows existing DexSearchProvider pattern using ContextField<T, 'ReadWrite'> from @pokehub/frontend/shared-context

---

3.  Create Filter/Sort Hook

File: /packages/frontend/pokehub-team-builder/src/lib/team-viewer/hooks/useFilteredTeams.ts

Action: Create useFilteredTeams(teams) hook

Logic:

- Filter by search term (case-insensitive, team name only)
- Filter by generation (if not 'all')
- Filter by format (if not 'all')
- Sort by selected field and order
- Return memoized filtered/sorted array

Performance: Client-side filtering is efficient for expected team counts (<100 teams per user)

---

4.  Create Team Card Components

Directory: /packages/frontend/pokehub-team-builder/src/lib/team-viewer/components/

Component 1: team-card.tsx - Grid view card

- Display: Team name, generation badge, format badge
- Pokemon sprites grid (6 slots using @pkmn/img)
- Last updated timestamp (using date-fns formatDistanceToNow)
- Actions: DropdownMenu with Edit/Duplicate/Delete (appears on hover)
- Hover effects for better UX

Component 2: team-list-item.tsx - List view item

- Horizontal layout: Pokemon sprites | Team info | Action buttons
- Same data as card but different layout
- Direct action buttons (no dropdown)

Component 3: delete-team-dialog.tsx - Confirmation dialog

- AlertTriangle icon (destructive action indicator)
- Shows team name for clarity
- Cancel + Delete buttons
- Disabled state during deletion

Dependencies: Add date-fns to package.json for timestamp formatting

---

5.  Enhanced TeamViewer Component

File: /packages/frontend/pokehub-team-builder/src/lib/team-viewer/team-viewer.tsx

Action: Replace stub implementation with full-featured component

Features:

- Fetch teams using useUserTeams() hook
- Filter/sort using useFilteredTeams() hook
- Search input with debounce (300ms)
- Generation dropdown filter
- Format dropdown filter (uses useFormats() hook)
- Sort dropdown (by name/created/updated, asc/desc)
- Grid/List view toggle buttons
- Results count and "Clear Filters" button
- Empty states (no teams vs no results from filters)
- Loading state with Skeleton components
- Error state with retry message
- Duplicate handler: Creates copy → navigates to editor
- Delete handler: Shows confirmation dialog
- Toast notifications for success/error

UI Pattern: Follows DexSearchContainer pattern for consistency

---

6.  Update Page with Server-Side Prefetch and Hydration

File: /apps/pokehub-app/app/team-builder/page.tsx

Action: Fetch teams on server, prefetch into QueryClient, and wrap with HydrationBoundary

```typescript
import {
  TeamViewer,
  TeamViewerProvider,
  getUserTeams,
  teamsKeys,
} from '@pokehub/frontend/pokehub-team-builder';
import { auth } from '@pokehub/frontend/shared-auth/server';
import { getQueryClient } from '@pokehub/frontend/shared-data-provider';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

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

Key details:

- Fetches teams on server using auth() for access token
- Prefetches data into QueryClient using same queryKey as client hook
- Dehydrates QueryClient state and passes to HydrationBoundary
- Client-side useUserTeams() hook will automatically use prefetched data
- No loading state on initial render - data is instantly available
- Eliminates client-side request waterfall

---

7.  Update Package Exports

File: /packages/frontend/pokehub-team-builder/src/index.ts

Action: Export new components

- TeamViewerProvider
- useUserTeams (for external use if needed)

---

8.  Add Dependency

File: /packages/frontend/pokehub-team-builder/package.json

Action: Add date-fns dependency
{
"dependencies": {
"date-fns": "^3.0.0"
}
}

Then run: npm install

---

Key Design Decisions

Data Fetching

- **Server-side prefetch with React Query hydration** for instant initial render
- Fetches teams on server using NextAuth session access token
- Prefetches into QueryClient and dehydrates state via HydrationBoundary
- Client-side useUserTeams() hook automatically uses prefetched data
- Mutations already invalidate the teams cache automatically
- 30-second stale time balances freshness and performance
- Eliminates loading state and request waterfall on initial page load

Filter State Management

- React Context following existing DexSearchProvider pattern
- Filters persist during session
- Default sort: newest updated first (most relevant)

Duplicate Flow

1.  Call useCreateTeam() with modified team data
2.  Add "(Copy)" suffix to team name
3.  Navigate to /team-builder/[newTeamId] on success
4.  Show toast notification

Delete Flow

1.  Show confirmation dialog with team name
2.  Call useDeleteTeam() on confirm
3.  Dialog closes on success
4.  Cache automatically invalidates and refetches
5.  Show toast notification

Performance

- Client-side filtering (fast for <100 teams)
- Debounced search input (300ms)
- Memoized filter/sort calculations
- Lazy loading not needed (load all teams at once)

---

Critical Files

Files to Modify

1.  /packages/frontend/pokehub-team-builder/src/lib/hooks/useTeams.ts - Add useUserTeams() hook
2.  /packages/frontend/pokehub-team-builder/src/lib/team-viewer/team-viewer.tsx - Replace with full implementation
3.  /apps/pokehub-app/app/team-builder/page.tsx - Add server-side prefetch with HydrationBoundary
4.  /packages/frontend/pokehub-team-builder/src/index.ts - Add exports
5.  /packages/frontend/pokehub-team-builder/package.json - Add date-fns

Files to Create

6.  /packages/frontend/pokehub-team-builder/src/lib/api/teams-api.server.ts - Server-side getUserTeams function
7.  /packages/frontend/pokehub-team-builder/src/lib/team-viewer/context/team-viewer.context.model.ts
8.  /packages/frontend/pokehub-team-builder/src/lib/team-viewer/context/team-viewer.context.ts
9.  /packages/frontend/pokehub-team-builder/src/lib/team-viewer/context/team-viewer.provider.tsx
10. /packages/frontend/pokehub-team-builder/src/lib/team-viewer/hooks/useFilteredTeams.ts
11. /packages/frontend/pokehub-team-builder/src/lib/team-viewer/components/team-card.tsx
12. /packages/frontend/pokehub-team-builder/src/lib/team-viewer/components/team-list-item.tsx
13. /packages/frontend/pokehub-team-builder/src/lib/team-viewer/components/delete-team-dialog.tsx

---

Testing Checklist

Manual Testing

- Empty state shows when no teams exist
- Teams display in grid view with Pokemon sprites
- Teams display in list view
- Grid/List toggle switches correctly
- Search filters teams by name (case-insensitive)
- Generation filter works
- Format filter works
- Sort by name/created/updated works (asc/desc)
- "Create New Team" navigates to /team-builder/new
- Edit button navigates to /team-builder/[id]
- Duplicate creates copy and navigates to editor
- Delete shows confirmation dialog
- Delete removes team after confirmation
- Cancel closes delete dialog without deleting
- Filters count badge shows active filter count
- Clear filters resets all filters
- Loading state shows skeleton
- Error state shows error message
- Toast notifications appear for actions

Unit Tests (Future)

- Create test files for new components
- Test filter/sort logic in useFilteredTeams
- Test context provider state management
- Follow existing test patterns from team editor

---

Implementation Order

1.  Add useUserTeams hook → Test in isolation
2.  Create context files → Test provider works
3.  Create useFilteredTeams hook → Test filter/sort logic
4.  Create TeamCard component → Test rendering
5.  Create TeamListItem component → Test rendering
6.  Create DeleteTeamDialog component → Test dialog behavior
7.  Update TeamViewer component → Test full integration
8.  Update page with provider → Test in browser
9.  Update exports → Test imports work
10. Add date-fns dependency → Run npm install

---

Success Criteria

✅ Users can view all their teams in grid or list view
✅ Users can search teams by name
✅ Users can filter by generation and format
✅ Users can sort by name, date created, or date updated
✅ Users can duplicate a team (creates copy and opens editor)
✅ Users can delete a team (with confirmation)
✅ Empty states show appropriate messaging
✅ Loading and error states handled gracefully
✅ Actions show toast notifications
✅ All features work smoothly with existing team editor
