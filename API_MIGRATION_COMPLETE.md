# API Migration Complete ✅

## Summary

Successfully migrated the play recognition and content generation system from Next.js API routes to Netlify Functions with proper multi-tenancy, RBAC, and longer timeout support for AI processing.

## Deleted Old API Routes

### Play-Related APIs (Migrated to Netlify Functions)
1. ✅ **`src/app/api/check-play-status/route.ts`** - DELETED
   - Replaced by: `netlify/functions/plays-get.ts`
   - Usage: `playsAPI.getPlay()`

2. ✅ **`src/app/api/review-play-content/route.ts`** - DELETED
   - Replaced by: `netlify/functions/plays-update-status.ts`
   - Usage: `playsAPI.updatePlayStatus()`

3. ✅ **`src/app/api/generate-play-content/route.ts`** - DELETED
   - Replaced by: `netlify/functions/plays-create.ts` + `process-play-content-background.ts`
   - Usage: `playsAPI.createPlay()` with `triggerProcessing: true`

4. ✅ **`src/app/api/playbooks/route.ts`** (Next.js version) - DELETED
   - Replaced by: `netlify/functions/playbooks.ts`
   - Usage: Direct fetch to Netlify function via `getPlaybooksApiUrl()`

### Cleaned Up Files
5. ✅ **All `.backup` and `.backup2` files** - DELETED (15 files)
   - These were temporary backups during migration
   - Git history provides version control

6. ✅ **Empty directories in `/src/app/api/`** - DELETED
   - Removed orphaned directories from deleted routes

## Updated Configuration Files

### `/src/lib/constants.ts`
- Removed old API endpoint constants:
  - ❌ `PLAYBOOKS: '/api/playbooks'`
  - ❌ `GENERATE_PLAY_CONTENT: '/api/generate-play-content'`
  - ❌ `REVIEW_PLAY_CONTENT: '/api/review-play-content'`
- Kept legacy endpoints still in use:
  - ✓ `PLAYBOOK_METADATA` (will migrate later)
  - ✓ `GET_APPROVED_PLAYS` (marked as TODO for migration)

### `/src/lib/api-config.ts`
- Removed unused functions:
  - ❌ `getCheckPlayStatusApiUrl()`
  - ❌ `getReviewPlayContentApiUrl()`
  - ❌ `getCreatePlayRecordApiUrl()`
  - ❌ `getProcessPlayContentApiUrl()`
- Kept active functions:
  - ✓ `getPlaybooksApiUrl()` - File upload
  - ✓ `getAnalyzePlaysApiUrl()` - Play diagram analysis
  - ✓ `getPlaybookMetadataApiUrl()` - Metadata management
  - ✓ `getGenerateInsightsApiUrl()` - AI insights generation
  - ✓ `getApprovedPlaysApiUrl()` - Marked as @deprecated
  - ✓ `getClearPlayContentApiUrl()` - Content cleanup

## New API Architecture

### Netlify Functions (Org-Scoped with RBAC)

#### Play Management
- `plays-create.ts` - Create new plays
- `plays-list.ts` - List plays with filters (status, playType, orgId, teamId)
- `plays-get.ts` - Get single play with assignments/flashcards
- `plays-update-status.ts` - Approve/reject/publish plays
- `plays-process.ts` - Trigger AI processing manually

#### Background Processing
- `process-play-content-background.ts` - AI content generation (15min timeout)
  - GPT-4o Vision for play analysis
  - Assignment generation
  - Flashcard generation
  - Insights generation

#### Flashcards & Quizzes
- `flashcards-list.ts` - List flashcards for play/position
- `flashcards-regenerate.ts` - Regenerate flashcards
- `quizzes-assignments-create.ts` - Create quiz assignments
- `quizzes-assignments-get.ts` - Get quiz assignment
- `quizzes-assignments-list.ts` - List quiz assignments
- `quizzes-attempts-start.ts` - Start quiz attempt
- `quizzes-attempts-submit.ts` - Submit quiz attempt

### Client-Side API Wrappers

#### `/src/lib/api/plays.ts`
```typescript
playsAPI.createPlay(data, token) - Create play
playsAPI.listPlays(params, token) - List plays
playsAPI.getPlay(playId, token, options) - Get play details
playsAPI.updatePlayStatus(playId, data, token, orgId) - Update status
playsAPI.processPlay(playId, data, token) - Trigger processing
```

#### `/src/lib/api/flashcards.ts`
```typescript
flashcardsAPI.listFlashcards(params, token) - List flashcards
flashcardsAPI.regenerateFlashcards(playId, token) - Regenerate
```

#### `/src/lib/api/quizzes.ts`
```typescript
quizzesAPI.createAssignment(data, token) - Create assignment
quizzesAPI.getAssignment(id, token) - Get assignment
quizzesAPI.listAssignments(params, token) - List assignments
quizzesAPI.startAttempt(data, token) - Start attempt
quizzesAPI.submitAttempt(attemptId, data, token) - Submit attempt
```

### Custom React Hooks

#### `/src/hooks/usePlaysAPI.ts`
- `usePlays(params)` - List plays with auto-fetch
- `usePlay(playId, options)` - Get single play with auto-fetch
- `useCreatePlay()` - Create play hook
- `useUpdatePlayStatus()` - Update status hook
- `useProcessPlay()` - Trigger processing hook

#### `/src/hooks/useFlashcardsAPI.ts`
- `useFlashcards(params)` - List flashcards with auto-fetch

#### `/src/hooks/useQuizzesAPI.ts`
- `useQuizAssignments(params)` - List quiz assignments with auto-fetch

## Migrated Components

### ✅ Fully Migrated
1. **`src/components/play-recognition/SavedPlayLibrary.tsx`**
   - Uses `playsAPI` for all operations
   - Proper error handling
   - Org-scoped API calls

2. **`src/contexts/PlayContentGenerationContext.tsx`**
   - Uses `playsAPI.createPlay()` with auto-processing
   - Polls using `playsAPI.getPlay()`
   - Proper orgId scoping

3. **`src/app/play-recognition/page.tsx`**
   - Uses Netlify functions for file upload
   - Proper orgId from useAuth

## Remaining Legacy Code

### Still Uses Old APIs (Needs Future Migration)
1. **`src/app/coach/assignments/page.tsx`**
   - Uses: `/api/coach/assignments`
   - Uses: `/api/get-approved-plays`
   - TODO: Migrate to new assignment APIs

2. **`src/app/games/assignment/page.tsx`**
   - Uses: `/api/get-approved-plays`
   - TODO: Migrate to `playsAPI.listPlays()` + `flashcardsAPI.listFlashcards()`

3. **`src/app/games/play-name-id/page.tsx`**
   - Uses: `/api/get-approved-plays`
   - TODO: Migrate to `playsAPI.listPlays()`

## Migration Benefits

### 1. Multi-Tenancy
- All endpoints scoped to `orgId` (not just `teamId`)
- Proper isolation between organizations
- Flexible team hierarchies within orgs

### 2. Role-Based Access Control (RBAC)
- `withOrgAuth(role)` middleware
- Roles: `player`, `coach`, `admin`
- Automatic permission checks on all endpoints

### 3. Better Performance
- 15-minute timeout for background AI processing (vs 10 seconds)
- Proper async/await patterns
- Fire-and-forget background jobs

### 4. Improved Error Handling
- Standardized error responses
- Validation errors with field names
- Proper HTTP status codes

### 5. Type Safety
- Consistent TypeScript interfaces
- UUID validation
- Enum validation

### 6. Simplified Client Code
- API client classes (`playsAPI`, `flashcardsAPI`, `quizzesAPI`)
- Custom React hooks with auto-fetch
- Environment-based URL routing (local vs production)

### 7. Better Developer Experience
- Clear separation between Netlify functions and Next.js routes
- Consistent naming conventions
- Comprehensive error logging

## Database Schema Updates

During migration, we added proper multi-tenancy support:

1. ✅ **`playbook_metadata.team_id`** - Made nullable (org-wide content supported)
2. ✅ **`play_assignments.org_id`** - Added column for proper scoping
3. ✅ **`plays.org_id`** - Organization ownership
4. ✅ **`flashcard_templates.org_id`** - Organization ownership

## Testing Checklist

### ✅ Play Generation Flow
- [x] Upload play image
- [x] Create play with auto-processing
- [x] Background AI processing completes
- [x] Poll for status (stops when draft/approved)
- [x] Review modal displays content
- [x] Approve and publish play
- [x] Play appears in coach's playbook

### ✅ API Endpoints
- [x] plays-create with triggerProcessing
- [x] plays-list with filters (orgId, status, playType)
- [x] plays-get with orgId parameter
- [x] plays-update-status (approve + publish in single request)
- [x] process-play-content-background (GPT-4o Vision)

### ✅ Authentication & Authorization
- [x] Token passed in Authorization header
- [x] Org membership verification
- [x] Role-based access control
- [x] orgId required on all endpoints

## Next Steps

### Future Migrations
1. Migrate coach assignments page to new API
2. Migrate player assignment page to new API
3. Migrate play-name-id page to new API
4. Remove `/api/get-approved-plays` (Next.js and Netlify versions)
5. Consider migrating remaining Next.js API routes to Netlify functions

### Potential Improvements
1. Add caching layer for frequently accessed plays
2. Add pagination to plays-list endpoint
3. Add search functionality to plays-list
4. Add bulk operations for plays (batch approve, batch publish)
5. Add webhook support for external integrations

## Documentation

See also:
- `OLD_API_CLEANUP_PLAN.md` - Detailed cleanup checklist
- `PLAY_RECOGNITION_REFACTORING_SUMMARY.md` - Original refactoring notes
- `netlify/functions/README.md` - Netlify functions guide (if exists)

## Success Metrics

- ✅ 4 old API routes deleted
- ✅ 15 backup files removed
- ✅ 2 configuration files cleaned up
- ✅ 0 references to deleted API routes in active code
- ✅ Full play generation flow working end-to-end
- ✅ Proper org-scoped multi-tenancy
- ✅ RBAC implemented on all new endpoints
- ✅ 15-minute timeout for AI processing

**Migration Status: 90% Complete**
- Core play management: ✅ Complete
- Flashcards & quizzes: ✅ Complete
- Assignment pages: ⏳ Pending (3 pages)
