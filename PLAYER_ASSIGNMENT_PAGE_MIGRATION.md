# Player Assignment Page Migration Summary

## Overview
Migrated the player assignment page from hardcoded team ID to organization-scoped access using the authenticated user's orgId.

## Problem
The page was using a hardcoded `DEV_TEAM_ID` constant and not utilizing the actual user's organization context, which:
- Broke authentication flow for real users
- Caused "Failed to fetch assignments" API errors
- Didn't scale for multi-tenant architecture

## Solution
Changed from hardcoded team ID to org-scoped access using authenticated user's orgId:
- **Before**: Used `DEV_TEAM_ID` constant from lib/constants
- **After**: Uses `orgId` from useAuth() hook with optional position filtering

## Files Modified

### 1. Frontend Page: `src/app/games/assignment/page.tsx`
**Backup created:** `src/app/games/assignment/page.tsx.backup`

**Changes:**
- Removed `DEV_TEAM_ID` import and constant usage
- Changed from hardcoded `teamId` to `orgId` from useAuth hook
- Updated `fetchAssignments()` to use orgId parameter
- Updated `handleStartQuiz()` to use orgId for flashcard fetching
- Added auth check in handleStartQuiz with proper error message
- Updated useEffect dependency from teamId to orgId

**Key Updates:**
```typescript
// Before
import { DEV_TEAM_ID } from "@/lib/constants";
const [teamId] = useState<string>(DEV_TEAM_ID);
const response = await fetch(`/api/coach/assignments?teamId=${teamId}`);

// After
const { userPositions, userRole, orgId, loading: authLoading } = useAuth();
const response = await fetch(`/api/coach/assignments?orgId=${orgId}`);
```

### 2. fetchAssignments Function Updates
**Before:**
```typescript
useEffect(() => {
  const fetchAssignments = async () => {
    if (!teamId) return;

    const response = await fetch(`/api/coach/assignments?teamId=${teamId}`);
    // or
    const response = await fetch(`/api/coach/assignments?teamId=${teamId}&position=${pos}`);
  };

  fetchAssignments();
}, [teamId, userPositions]);
```

**After:**
```typescript
useEffect(() => {
  const fetchAssignments = async () => {
    if (!orgId) return;

    try {
      setIsLoadingAssignments(true);

      if (userPositions.length === 0) {
        // No positions - fetch all assignments
        const response = await fetch(`/api/coach/assignments?orgId=${orgId}`);
        if (!response.ok) throw new Error('Failed to fetch assignments');
        const data = await response.json();
        setAssignments(data.assignments || []);
      } else {
        // Fetch assignments for all user positions
        const assignmentPromises = userPositions.map(pos =>
          fetch(`/api/coach/assignments?orgId=${orgId}&position=${pos}`)
            .then(res => res.json())
        );

        const assignmentResults = await Promise.all(assignmentPromises);
        const allAssignments = assignmentResults.flatMap(result => result.assignments || []);

        // Remove duplicates by assignment ID
        const uniqueAssignments = allAssignments.filter((assignment, index, self) =>
          index === self.findIndex(a => a.id === assignment.id)
        );

        setAssignments(uniqueAssignments);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  if (!authLoading) {
    fetchAssignments();
  }
}, [orgId, userPositions, authLoading]);
```

### 3. handleStartQuiz Function Updates
**Before:**
```typescript
const handleStartQuiz = async (playId: string) => {
  if (userPositions.length === 0) {
    alert('Please set your positions in settings to take quizzes');
    return;
  }

  const flashcardPromises = userPositions.map(pos =>
    fetch(`/api/get-approved-plays?teamId=${teamId}&playId=${playId}&type=assignment-flashcards&position=${pos}`)
      .then(res => res.json())
  );
};
```

**After:**
```typescript
const handleStartQuiz = async (playId: string) => {
  if (userPositions.length === 0) {
    alert('Please set your positions in settings to take quizzes');
    return;
  }

  if (!orgId) {
    alert('Authentication error. Please sign in.');
    return;
  }

  try {
    // Fetch flashcards for this play and user positions
    const flashcardPromises = userPositions.map(pos =>
      fetch(`/api/get-approved-plays?orgId=${orgId}&playId=${playId}&type=assignment-flashcards&position=${pos}`)
        .then(res => res.json())
    );

    const flashcardResults = await Promise.all(flashcardPromises);
    const allFlashcards = flashcardResults.flatMap(result => result.flashcards || []);

    // Remove duplicates and shuffle
    // ... rest of logic
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    alert('Failed to load quiz. Please try again.');
  }
};
```

## Benefits

### 1. Works for All Authenticated Users
- ✅ Uses real user's organization context
- ✅ No hardcoded values or development constants
- ✅ Proper authentication checks before API calls
- ✅ Works in all environments (dev, staging, production)

### 2. Better Error Handling
- Added auth check in handleStartQuiz with clear error message
- Try-catch blocks for better error handling
- Loading states properly managed
- Clear feedback to users when authentication fails

### 3. Position-Based Filtering
- Fetches assignments for user's specific positions
- Falls back to all org assignments if no positions set
- Removes duplicate assignments across positions
- Efficient parallel fetching with Promise.all

## Testing

### Test Cases
- [ ] Player with positions can view their assignments
- [ ] Player without positions can view all org assignments
- [ ] Quiz button works and fetches correct flashcards
- [ ] Auth error shown when orgId is missing
- [ ] Loading states display correctly
- [ ] Filters work (search, play type, formation, position category)
- [ ] Assignment details view shows correctly
- [ ] Quiz mode works with flashcards

### Manual Testing Steps
1. Sign in as a player with positions set
2. Navigate to `/games/assignment`
3. Verify assignments load without errors
4. Test filters (search, play type, formation)
5. Click on an assignment to view details
6. Click "Take Quiz for This Play"
7. Verify flashcards load correctly
8. Complete quiz and verify score tracking

## API Dependencies

This page depends on two API endpoints:

### GET /api/coach/assignments
**Parameters:**
- `orgId` (required) - Organization ID from auth context
- `position` (optional) - Filter by position

**Used For:**
- Fetching assignments for display

### GET /api/get-approved-plays
**Parameters:**
- `orgId` (required) - Organization ID from auth context
- `playId` (required) - Play to fetch flashcards for
- `type` (required) - Must be "assignment-flashcards"
- `position` (optional) - Filter flashcards by position

**Used For:**
- Fetching flashcards for quiz mode

## Related Files

### Dependencies
- `@/contexts/AuthContext` - Provides orgId and userPositions
- `@/components/auth/ProtectedRoute` - Ensures authenticated access
- `@/lib/positions` - Position category utilities
- `@/lib/supabase/types/database` - Type definitions

### Related Pages That May Need Similar Migration
- `/games/quiz-cards/page.tsx` - Player quiz practice mode
- `/games/blitz-id/page.tsx` - Blitz identification quiz
- `/games/formation/page.tsx` - Formation identification quiz
- `/games/play-name-id/page.tsx` - Play name identification quiz
- `/games/route-tag/page.tsx` - Route tag quiz

## Rollback

If issues occur:
```bash
# Restore backup
cp src/app/games/assignment/page.tsx.backup src/app/games/assignment/page.tsx
```

## Performance Considerations

- Position-based filtering happens server-side (efficient)
- Parallel fetching for multiple positions using Promise.all
- Duplicate removal happens client-side (minimal overhead)
- Loading states prevent unnecessary re-fetches
- Flashcards fetched on-demand when quiz starts

## Security

- Requires authentication (orgId from auth context)
- Players can only see assignments for their organization
- Position filtering doesn't bypass org boundary
- RBAC enforced through ProtectedRoute component
- No hardcoded IDs or sensitive constants

---

**Migration Date:** January 25, 2026
**Status:** ✅ Complete
**Testing:** ⏳ Pending user verification
**Related Migration:** Coach Assignments Page (ASSIGNMENTS_PAGE_MIGRATION.md)
