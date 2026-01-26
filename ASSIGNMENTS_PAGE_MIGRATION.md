# Assignments Page Migration Summary

## Overview
Migrated the coach assignments page from team-scoped to organization-scoped access with optional team filtering.

## Problem
The page was checking for `teamId` which can be NULL in org_memberships, causing "Authentication Issue - No team ID found" error for users without an assigned team.

## Solution
Changed from team-scoped to org-scoped access:
- **Before**: Required `teamId`, failed if NULL
- **After**: Uses `orgId` (always present), with optional `teamId` filter

## Files Modified

### 1. API Route: `src/app/api/coach/assignments/route.ts`
**Changes:**
- Changed required parameter from `teamId` to `orgId`
- Made `teamId` an optional filter parameter
- Updated query to filter by `play.org_id` (required) and `play.team_id` (optional)
- Updated comments and error messages

**Before:**
```typescript
const teamId = searchParams.get('teamId');
if (!teamId) {
  return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
}
query = query.eq('play.team_id', teamId);
```

**After:**
```typescript
const orgId = searchParams.get('orgId');
const teamId = searchParams.get('teamId'); // Optional filter

if (!orgId) {
  return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
}

query = query.eq('play.org_id', orgId);

if (teamId && teamId !== 'all') {
  query = query.eq('play.team_id', teamId);
}
```

### 2. Frontend Page: `src/app/coach/assignments/page.tsx`
**Backup created:** `src/app/coach/assignments/page.tsx.backup`

**Changes:**
- Changed from `teamId` to `orgId` in useAuth hook
- Added `teams` state and `filterTeamId` state
- Added `fetchTeams()` function to load teams for dropdown
- Updated `fetchAssignments()` to use `orgId` with optional `teamId` parameter
- Added team filter dropdown in UI (only shows if teams exist)
- Updated all references from `teamId` to `orgId`
- Updated error messages to reference "organization" instead of "team"

**Key Updates:**
```typescript
// Before
const { teamId, loading: authLoading } = useAuth();
const response = await fetch(`/api/coach/assignments?teamId=${teamId}`);

// After
const { orgId, teamId: userTeamId, loading: authLoading } = useAuth();
const [filterTeamId, setFilterTeamId] = useState<string>('all');

const params = new URLSearchParams({ orgId: orgId! });
if (filterTeamId && filterTeamId !== 'all') {
  params.append('teamId', filterTeamId);
}
const response = await fetch(`/api/coach/assignments?${params}`);
```

### 3. New API Route: `src/app/api/organizations/[orgId]/teams/route.ts`
**Purpose:** Fetch teams for the filter dropdown

**Endpoint:** `GET /api/organizations/:orgId/teams`

**Response:**
```json
{
  "teams": [
    { "id": "uuid", "name": "Team Name" }
  ],
  "count": 2
}
```

## Features Added

### Team Filter Dropdown
- Shows "All Teams" by default (displays all org assignments)
- Dropdown only appears if organization has teams
- Filters assignments by selected team when changed
- Maintains other filters (position, category, search)

### Better Error Handling
- Clear error message when no orgId (instead of teamId)
- Shows orgId status in error state for debugging
- Gracefully handles users without team assignments

## Benefits

### 1. Works for All Users
- ✅ Users with team assignment (teamId present)
- ✅ Users without team assignment (teamId NULL)
- ✅ Coaches managing multiple teams
- ✅ Admins viewing org-wide assignments

### 2. Flexible Filtering
- View all org assignments by default
- Filter by specific team when needed
- Combine with position and category filters
- Search across all assignments

### 3. Better UX
- No authentication errors for valid users
- Clear team context in filters
- Intuitive "All Teams" default

## Database Schema Requirements

**plays table must have:**
- `org_id` column (UUID, required)
- `team_id` column (UUID, optional)

**teams table must have:**
- `org_id` column (UUID, required)
- `name` column (TEXT)

## Testing

### Test Cases
- [ ] User with orgId but no teamId can view assignments
- [ ] User with orgId and teamId can view assignments
- [ ] Team filter dropdown appears when teams exist
- [ ] "All Teams" filter shows all org assignments
- [ ] Specific team filter shows only that team's assignments
- [ ] Filters work together (team + position + category + search)
- [ ] Empty state shows when no assignments match filters

### Manual Testing Steps
1. Sign in as coach without team assignment
2. Navigate to `/coach/assignments`
3. Verify page loads without authentication error
4. Verify "All Teams" is selected by default
5. Select a specific team from dropdown
6. Verify assignments filter correctly
7. Test other filters in combination

## Migration Pattern

This pattern can be replicated for other pages:
1. Change required param from `teamId` to `orgId`
2. Make `teamId` optional filter parameter
3. Update query to filter by `org_id` (required) + `team_id` (optional)
4. Add team dropdown to UI (if applicable)
5. Update error messages and auth checks

## Rollback

If issues occur:
```bash
# Restore backup
cp src/app/coach/assignments/page.tsx.backup src/app/coach/assignments/page.tsx

# Revert API route (check git history)
git checkout HEAD -- src/app/api/coach/assignments/route.ts
```

## Related Pages That May Need Similar Migration

- `/coach/games/page.tsx` - May use teamId
- `/coach/performance/page.tsx` - May use teamId
- Player pages that reference team context

## API Compatibility

**Old API Calls (Still Work):**
```
GET /api/coach/assignments?teamId=xxx
```
Returns 400 error: "Organization ID is required"

**New API Calls:**
```
GET /api/coach/assignments?orgId=xxx                    // All org assignments
GET /api/coach/assignments?orgId=xxx&teamId=yyy        // Specific team
GET /api/coach/assignments?orgId=xxx&teamId=all        // Explicit all teams
```

## Performance Considerations

- Fetching all org assignments may return more data than team-scoped
- Consider pagination if org has many teams with many assignments
- Team filter is server-side (efficient filtering in database)
- Client-side filters (search, position) work on filtered dataset

## Security

- Still requires authentication (orgId from auth context)
- Users can only see assignments for their organization
- Team filter doesn't bypass org boundary
- RBAC still enforced at org level

---

**Migration Date:** January 25, 2024
**Status:** ✅ Complete
**Testing:** ⏳ Pending user verification
