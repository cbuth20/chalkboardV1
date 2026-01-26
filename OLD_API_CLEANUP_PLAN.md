# Old API Cleanup Plan

## ✅ Successfully Migrated & Can Be Removed

### Play Recognition & Content Generation
These old API routes have been replaced by Netlify functions and are NO LONGER USED:

1. **`src/app/api/check-play-status/route.ts`**
   - ❌ Old: `/api/check-play-status`
   - ✅ New: `plays-get` Netlify function via `playsAPI.getPlay()`
   - Usage: None (successfully migrated)

2. **`src/app/api/review-play-content/route.ts`**
   - ❌ Old: `/api/review-play-content`
   - ✅ New: `plays-update-status` Netlify function via `playsAPI.updatePlayStatus()`
   - Usage: None (successfully migrated)

3. **`src/app/api/generate-play-content/route.ts`**
   - ❌ Old: `/api/generate-play-content`
   - ✅ New: `plays-create` + `process-play-content-background` Netlify functions
   - Usage: None (successfully migrated)

### Playbooks
4. **`src/app/api/playbooks/route.ts`** (Next.js API route)
   - ❌ Old: `/api/playbooks`
   - ✅ New: `netlify/functions/playbooks.ts` (Netlify function)
   - Usage: None in active code (only in constants files that aren't referenced)

## ⚠️ Needs Migration Before Removal

### Get Approved Plays
5. **`src/app/api/get-approved-plays/route.ts`**
   - Status: DEPRECATED but still in use
   - Current usage:
     - `src/app/coach/assignments/page.tsx` (line 107)
     - `src/app/games/assignment/page.tsx` (line 256)
     - `src/app/games/play-name-id/page.tsx`
   - Migration path: Use `plays-list` + `flashcards-list` Netlify functions
   - Netlify equivalent exists but marked deprecated

## 📋 Cleanup Checklist

### Step 1: Remove Unused API Routes ✅
- [x] Delete `src/app/api/check-play-status/route.ts`
- [x] Delete `src/app/api/review-play-content/route.ts`
- [x] Delete `src/app/api/generate-play-content/route.ts`
- [x] Delete `src/app/api/playbooks/route.ts` (Next.js version)

### Step 2: Remove Backup Files ✅
- [x] Delete all `.backup` and `.backup2` files in components
- [x] Clean up old markdown documentation files

### Step 3: Remove Unused Constants
- [ ] Clean up `src/lib/api-config.ts` - remove references to old API routes
- [ ] Clean up `src/lib/constants.ts` - remove old API endpoints

### Step 4: Future Migration Tasks
- [ ] Migrate `src/app/coach/assignments/page.tsx` to use new API
- [ ] Migrate `src/app/games/assignment/page.tsx` to use new API
- [ ] Migrate `src/app/games/play-name-id/page.tsx` to use new API
- [ ] After migration, remove `src/app/api/get-approved-plays/route.ts`
- [ ] After migration, remove `netlify/functions/get-approved-plays.ts` (deprecated)

## 🎉 Migration Summary

### Completed Migrations
- ✅ Play generation (SavedPlayLibrary component)
- ✅ Play content review and approval
- ✅ Play status polling
- ✅ Play listing with filters
- ✅ Playbook upload and metadata management

### New API Architecture
All play-related operations now use org-scoped Netlify functions with proper RBAC:
- `plays-create.ts` - Create plays
- `plays-list.ts` - List plays with filters (status, playType, orgId, teamId)
- `plays-get.ts` - Get single play with assignments/flashcards
- `plays-update-status.ts` - Approve/reject/publish plays
- `plays-process.ts` - Trigger AI processing
- `process-play-content-background.ts` - Background AI processing (15min timeout)
- `flashcards-list.ts` - List flashcards for play/position
- `quizzes-*.ts` - Quiz session management

### Benefits of New Architecture
1. **Multi-tenancy**: All endpoints scoped to orgId (not just teamId)
2. **RBAC**: Role-based access control (coach/admin/player)
3. **Longer timeouts**: Background functions get 15 minutes for AI processing
4. **Better error handling**: Standardized error responses
5. **Type safety**: Consistent TypeScript interfaces
6. **Validation**: UUID and enum validation with helpful errors
