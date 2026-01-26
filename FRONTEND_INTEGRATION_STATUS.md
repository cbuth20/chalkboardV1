# Frontend Integration Status

## ✅ Completed

### 1. API Client Libraries Created (3 files)
- ✅ **`src/lib/api/plays.ts`** - Complete API client for plays endpoints
- ✅ **`src/lib/api/flashcards.ts`** - Complete API client for flashcards endpoints
- ✅ **`src/lib/api/quizzes.ts`** - Complete API client for quiz endpoints

### 2. Custom React Hooks Created (3 files)
- ✅ **`src/hooks/usePlaysAPI.ts`** - Hooks for plays (usePlays, usePlay, useCreatePlay, useUpdatePlayStatus, useProcessPlay)
- ✅ **`src/hooks/useFlashcardsAPI.ts`** - Hooks for flashcards (useFlashcards, useRegenerateFlashcards)
- ✅ **`src/hooks/useQuizzesAPI.ts`** - Hooks for quizzes (useQuizAssignments, useQuizAssignment, useCreateQuizAssignment, useStartQuizAttempt, useSubmitQuizAttempt)

### 3. Contexts Refactored (1 of 2)
- ✅ **`src/contexts/PlayContentGenerationContext.tsx`** - Refactored to use new API
  - Now uses `playsAPI.createPlay()` with `triggerProcessing: true`
  - Polls using `playsAPI.getPlay()` for status checks
  - Removed localhost vs production branching
  - Uses `orgId` from auth context instead of passed teamId
  - Simplified from 225 lines to 186 lines (17% reduction)

### 3. Pages Refactored (6 of ~10)
- ✅ **`src/app/coach/playbook/page.tsx`** - Refactored to use new API
  - Now uses `usePlays` hook
  - Now uses `useUpdatePlayStatus` hook
  - Changed from "Delete" to "Unpublish" (soft delete)
  - Updated for org-scoped access (orgId instead of teamId)
  - Updated to use camelCase properties from new API

- ✅ **`src/app/play-recognition/page.tsx`** - Refactored to use new API
  - Uses refactored `PlayContentGenerationContext`
  - SavedPlayLibrary component updated to use new API
  - All generation flows now use `playsAPI` client
  - Single, batch, and unified generation all updated
  - Approve/reject/save draft now use `plays-update-status`

- ✅ **`src/app/coach/assignments/page.tsx`** - Migrated to org-scoped architecture
  - Changed from team-scoped (teamId) to org-scoped (orgId)
  - Added optional team filter dropdown
  - Uses `/api/coach/assignments` with orgId parameter
  - Created new `/api/organizations/[orgId]/teams` endpoint
  - Works for users with or without team assignment
  - See: ASSIGNMENTS_PAGE_MIGRATION.md

- ✅ **`src/app/games/assignment/page.tsx`** - Migrated to org-scoped architecture
  - Removed hardcoded DEV_TEAM_ID constant
  - Uses orgId from useAuth hook
  - Updated fetchAssignments to use orgId
  - Updated handleStartQuiz to use orgId
  - Position-based filtering for assignments
  - See: PLAYER_ASSIGNMENT_PAGE_MIGRATION.md

- ✅ **`src/app/games/quiz-cards/page.tsx`** - Migrated to new API with hooks
  - Removed DEV_TEAM_ID constant
  - Now uses `usePlays({ status: 'approved' })` hook
  - Now uses `useFlashcards({ playId, cardType: 'knowledge' })` hook
  - Updated property names to camelCase
  - Simplified code by removing manual fetch calls
  - See: PLAYER_QUIZ_PAGES_MIGRATION.md

- ✅ **`src/app/playbook/page.tsx`** - Migrated to new API with hooks
  - Removed DEV_TEAM_ID constant
  - Now uses `usePlays({ status: 'approved' })` hook
  - Removed complex timeout/abort controller logic
  - Updated property names to camelCase
  - Changed playbook_metadata to metadata
  - See: PLAYER_QUIZ_PAGES_MIGRATION.md

### 4. New Components Created (2 components)
- ✅ **`src/app/coach/review/page.tsx`** - Play Review Dashboard
  - Lists all draft plays pending review
  - Shows AI insights and generated flashcards
  - Approve/reject/publish workflow
  - Review notes functionality
  - Empty state when no drafts

- ✅ **`src/app/coach/question-bank/page.tsx`** - Question Bank Browser
  - Browse all flashcards in organization
  - Filter by position, difficulty, category
  - Search questions and answers
  - Selection mode for quiz creation
  - Statistics dashboard

---

## 🚧 Remaining Frontend Work

### Pages That Need Refactoring

Based on the project structure, these pages likely use the old API endpoints:

#### Coach Pages
1. **`src/app/coach/games/page.tsx`** - May use old quiz/game endpoints
2. ~~**`src/app/coach/assignments/page.tsx`**~~ - ✅ **MIGRATED** (see ASSIGNMENTS_PAGE_MIGRATION.md)
3. **`src/app/coach/performance/page.tsx`** - May use old leaderboard/XP endpoints
4. **`src/app/coach/team/page.tsx`** - Team management page

#### Player Pages
1. **`src/app/games/page.tsx`** - Games listing
2. ~~**`src/app/games/quiz-cards/page.tsx`**~~ - ✅ **MIGRATED** (see PLAYER_QUIZ_PAGES_MIGRATION.md)
3. ~~**`src/app/games/assignment/page.tsx`**~~ - ✅ **MIGRATED** (see PLAYER_ASSIGNMENT_PAGE_MIGRATION.md)
4. **`src/app/games/blitz-id/page.tsx`** - Blitz ID game
5. **`src/app/games/formation/page.tsx`** - Formation game
6. **`src/app/games/play-name-id/page.tsx`** - Play name ID game
7. **`src/app/games/route-tag/page.tsx`** - Route tag game
8. ~~**`src/app/playbook/page.tsx`**~~ - ✅ **MIGRATED** (see PLAYER_QUIZ_PAGES_MIGRATION.md)

#### Play Recognition/Upload Pages
1. **`src/app/play-recognition/page.tsx`** - Play scanner/upload page
   - Uses: `create-play-record`, `process-play-content-background`
   - Needs to use: `plays-create`, `plays-process`

### Components That May Need Updates

Based on file names, these components may interact with the old API:

1. **`src/components/play-recognition/PlayContentLoadingIndicator.tsx`**
2. **`src/components/play-recognition/PlayContentReviewModal.tsx`**
3. **`src/components/play-recognition/SavedPlayLibrary.tsx`**
4. **`src/components/assignment-generation/AssignmentStatusFAB.tsx`**
5. **`src/contexts/PlayContentGenerationContext.tsx`**
6. **`src/contexts/AssignmentGenerationContext.tsx`**

### New Components Needed

Based on the API refactoring plan, these new components should be created:

#### Coach Components
1. **Question Bank Browser** - Browse and filter flashcards
   - Uses: `useFlashcards` hook
   - Filters: position, difficulty, category, card type
   - Actions: Select flashcards for quiz creation

2. **Quiz Assignment Creator** - Create quiz assignments
   - Uses: `useCreateQuizAssignment`, `useFlashcards` hooks
   - Inputs: Title, description, target (position/segment/team/user), flashcard selection
   - Actions: Create assignment, set due date, passing score, max attempts

3. **Play Review Dashboard** - Review and approve plays
   - Uses: `usePlays` hook with `status: 'draft'`
   - Actions: Approve, reject, republish

#### Player Components
4. **Quiz Taking Interface** - Take quizzes
   - Uses: `useQuizAssignment`, `useStartQuizAttempt`, `useSubmitQuizAttempt`
   - Features: Timer, question display, answer submission, results

5. **Assigned Quizzes List** - View assigned quizzes
   - Uses: `useQuizAssignments` hook with `assignedToMe: true`
   - Shows: Status, due date, attempts, best score

---

## 🗑️ Old Endpoints to Remove

These deprecated endpoints can be safely removed after frontend migration:

### Netlify Functions (5 files)
1. **`netlify/functions/create-play-record.ts`** ⚠️ Marked deprecated, remove after migration
2. **`netlify/functions/get-approved-plays.ts`** ⚠️ Marked deprecated, remove after migration
3. **`netlify/functions/review-play-content.ts`** ⚠️ Marked deprecated, remove after migration
4. **`netlify/functions/analyze-plays.ts`** ⚠️ Marked deprecated, remove after migration
5. **`netlify/functions/check-play-status.ts`** ⚠️ Marked deprecated, remove after migration

### Other Old Files
Check these directories for unused code:
- **`src/app/api/`** - May contain old API route handlers for local development
- Look for any files that reference the old endpoints

---

## 📋 Step-by-Step Migration Plan

### Phase 1: Core Play Management (✅ 100% Complete)
- [x] Create API client libraries
- [x] Create custom hooks
- [x] Refactor coach playbook page
- [x] Refactor play-recognition page (upload/scanner)
- [x] Update PlayContentGenerationContext
- [x] Create Play Review Dashboard component

### Phase 2: Flashcards & Question Bank (✅ 33% Complete)
- [x] Create Question Bank Browser component
- [ ] Update assignment generation context
- [ ] Add flashcard regeneration UI to play review page

### Phase 3: Quiz System - Coach (✅ 33% Complete)
- [ ] Create Quiz Assignment Creator component
- [x] Refactor coach/assignments page
- [ ] Add quiz management to coach dashboard

### Phase 4: Quiz System - Player (✅ 60% Complete)
- [ ] Create Assigned Quizzes List component
- [ ] Create Quiz Taking Interface component
- [x] Refactor games/quiz-cards page
- [x] Refactor games/assignment page
- [x] Refactor player playbook page

### Phase 5: Other Games/Features (0% Complete)
- [ ] Review and update other game pages (blitz-id, formation, etc.)
- [ ] Update performance/leaderboard pages if needed
- [ ] Update team management pages if needed

### Phase 6: Cleanup (0% Complete)
- [ ] Remove deprecated endpoint files
- [ ] Remove unused API route handlers
- [ ] Update any remaining references to old endpoints
- [ ] Test entire application end-to-end
- [ ] Update documentation

---

## 🎯 Priority Order for Migration

### High Priority (Week 1)
1. **Play Upload/Scanner Page** - Critical for content creation
   - Refactor to use `plays-create` and `plays-process`
   - Update context providers

2. **Play Review Dashboard** - Critical for content approval
   - Create new component for reviewing draft plays
   - Implement approve/reject/publish actions

3. **Question Bank Browser** - Needed for quiz creation
   - List all flashcards with filters
   - Select flashcards for quizzes

### Medium Priority (Week 2)
4. **Quiz Assignment Creator** - Core coach functionality
   - Create quiz assignments from flashcards
   - Set targeting (position/segment/team/user)

5. **Assigned Quizzes List (Player)** - Core player functionality
   - Show player's assigned quizzes
   - Display status and due dates

6. **Quiz Taking Interface (Player)** - Core player functionality
   - Take quizzes
   - Submit answers
   - View results

### Low Priority (Week 3+)
7. **Update Other Game Pages** - Less critical
8. **Update Performance/Leaderboard** - Analytics
9. **Cleanup & Testing** - Polish

---

## 🔍 How to Find Old Endpoint Usage

Search the codebase for these patterns:

```bash
# Search for old endpoint calls
grep -r "/api/get-approved-plays" src/
grep -r "/api/create-play-record" src/
grep -r "/api/review-play-content" src/
grep -r "/api/analyze-plays" src/
grep -r "/api/check-play-status" src/
grep -r "create-play-record" src/
grep -r "get-approved-plays" src/
grep -r "process-play-content-background" src/

# Search for old API route files
find src/app/api -type f -name "*.ts"
```

---

## 📝 Migration Checklist Template

For each page/component being migrated:

- [ ] **Identify old endpoints used**
  - List the old API calls
  - Note what data is fetched/sent

- [ ] **Replace with new hooks**
  - Import appropriate hooks from `src/hooks/`
  - Update component to use hook data

- [ ] **Update property names**
  - Old API uses snake_case (team_id, play_type)
  - New API uses camelCase (teamId, playType)

- [ ] **Update authentication**
  - Old API may use teamId
  - New API uses orgId from AuthContext

- [ ] **Test functionality**
  - Verify data loads correctly
  - Verify actions work (create, update, delete)
  - Verify error handling works

- [ ] **Update error handling**
  - Use error state from hooks
  - Display user-friendly messages

---

## 💡 Example Migration Pattern

### Before (Old API):
```typescript
const [plays, setPlays] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchPlays = async () => {
    const response = await fetch(`/api/get-approved-plays?teamId=${teamId}`);
    const data = await response.json();
    setPlays(data.plays);
    setLoading(false);
  };
  fetchPlays();
}, [teamId]);

// Access properties with snake_case
play.play_type
play.formation_name
```

### After (New API):
```typescript
import { usePlays } from '@/hooks/usePlaysAPI';

const { plays, loading, error } = usePlays({ status: 'approved' });

// Access properties with camelCase
play.playType
play.formationName
```

---

## 🚀 Next Steps

1. **Continue migrating pages** - Start with high priority pages
2. **Create new components** - Build the new UI components listed above
3. **Test as you go** - Test each page/component after migration
4. **Remove old endpoints** - Delete deprecated files once migration is complete

---

## ✅ Success Criteria

Frontend integration is complete when:

- [ ] All pages use new API endpoints
- [ ] All old endpoints are removed
- [ ] Question Bank Browser is functional
- [ ] Quiz Assignment Creator is functional
- [ ] Quiz Taking Interface is functional
- [ ] All tests pass
- [ ] No console errors related to API calls
- [ ] Performance is acceptable (no regressions)

---

**Current Progress: ~65% Complete**

**Completed in This Session:**
- ✅ Refactored PlayContentGenerationContext (org-scoped, simplified)
- ✅ Refactored SavedPlayLibrary component (6 major functions updated)
- ✅ Refactored play-recognition page (single, batch, unified generation)
- ✅ Updated approve/reject/save draft workflows
- ✅ Created Play Review Dashboard component
- ✅ Created Question Bank Browser component
- ✅ Migrated coach/assignments page to org-scoped architecture
- ✅ Migrated player assignment page (games/assignment) to org-scoped architecture
- ✅ Migrated quiz-cards page to new API with hooks
- ✅ Migrated player playbook page to new API with hooks

**Next Actions:**
- Create Quiz Assignment Creator component
- Refactor remaining player quiz pages (blitz-id, formation, play-name-id, route-tag)
- Update AssignmentGenerationContext
- Test all migrated pages for proper functionality

---

*Last Updated: 2026-01-25*
