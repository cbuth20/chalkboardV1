# Implementation Checklist
## Step-by-Step Guide to Refactor APIs

---

## Phase 1: Database Migration (Week 1)

### Day 1-2: Prepare Database
- [ ] **Review** `migration_to_org_scoped.sql`
- [ ] **Test** migration on local/dev database
- [ ] **Run** migration on development environment
  ```bash
  # From Supabase dashboard or psql
  psql -h <host> -U <user> -d <database> -f migrations/migration_to_org_scoped.sql
  ```
- [ ] **Verify** all `org_id` columns are backfilled
  ```sql
  SELECT COUNT(*) FROM plays WHERE org_id IS NULL;
  SELECT COUNT(*) FROM playbook_metadata WHERE org_id IS NULL;
  SELECT COUNT(*) FROM flashcard_templates WHERE org_id IS NULL;
  ```
- [ ] **Create** new quiz tables (quiz_assignments, quiz_attempts, etc.)
- [ ] **Test** RLS policies work correctly
  ```sql
  -- Test as different users
  SET request.jwt.claims.sub = '<test-user-uuid>';
  SELECT * FROM plays; -- Should only see user's org plays
  ```

### Day 3: Update TypeScript Types
- [ ] **Replace** `src/lib/supabase/types/database.ts` with `refined_database_types.ts`
- [ ] **Fix** TypeScript errors across codebase
- [ ] **Add** new types for quiz system:
  - `DbQuizAssignment`
  - `DbQuizAttempt`
  - `DbQuizAttemptAnswer`
- [ ] **Update** Supabase client to use new types

---

## Phase 2: Create Shared Utilities (Week 1)

### Day 4: Auth Middleware
- [ ] **Create** `netlify/functions/shared/auth.ts`
  ```typescript
  export async function withOrgAuth(
    requiredRole: 'admin' | 'coach' | 'player',
    handler: Handler
  ): Promise<Handler>;
  ```
- [ ] **Implement** role checking logic
- [ ] **Test** with different user roles

### Day 5: Shared Utilities
- [ ] **Create** `netlify/functions/shared/supabase.ts`
  ```typescript
  export const getSupabaseClient = () => { ... };
  export const getSupabaseAdmin = () => { ... };
  ```
- [ ] **Create** `netlify/functions/shared/validators.ts`
  ```typescript
  export const validateOrgId = (orgId: string) => { ... };
  export const validateQuizAssignment = (data: any) => { ... };
  ```
- [ ] **Create** `netlify/functions/shared/errors.ts`
  ```typescript
  export class OrgAuthError extends Error { ... }
  export class ValidationError extends Error { ... }
  ```

---

## Phase 3: Implement Quiz API (Week 2)

### Day 6-7: Quiz Assignment Endpoints
- [ ] **POST** `/api/quizzes/assignments` (create-assignment.ts)
  - [ ] Validate request body
  - [ ] Check coach/admin permissions
  - [ ] Insert quiz_assignment record
  - [ ] Insert quiz_assignment_questions records
  - [ ] Return created assignment
  - [ ] **Test** with Postman/Insomnia

- [ ] **GET** `/api/quizzes/assignments` (list-assignments.ts)
  - [ ] Filter by orgId
  - [ ] Filter by assignedToMe for players
  - [ ] Return list with assignment metadata
  - [ ] **Test** as coach and player

- [ ] **GET** `/api/quizzes/assignments/:id` (get-assignment.ts)
  - [ ] Fetch assignment with questions
  - [ ] Check permissions (coach sees all, player only if assigned)
  - [ ] Return assignment details
  - [ ] **Test** permissions

### Day 8-9: Quiz Attempt Endpoints
- [ ] **POST** `/api/quizzes/attempts` (start-attempt.ts)
  - [ ] Validate user is assigned to quiz
  - [ ] Check max attempts not exceeded
  - [ ] Create quiz_attempt record
  - [ ] Return attempt with questions
  - [ ] **Test** max attempts enforcement

- [ ] **POST** `/api/quizzes/attempts/:id/submit` (submit-attempt.ts)
  - [ ] Validate attempt belongs to user
  - [ ] Grade each answer
  - [ ] Calculate score percentage
  - [ ] Award XP if passed
  - [ ] Create xp_event record
  - [ ] Update player_flashcard_progress (spaced repetition)
  - [ ] Return results
  - [ ] **Test** scoring logic

- [ ] **GET** `/api/quizzes/attempts` (list-attempts.ts)
  - [ ] Coach sees all org attempts
  - [ ] Player sees own attempts
  - [ ] Return attempt history with scores
  - [ ] **Test** as coach and player

---

## Phase 4: Refactor Plays API (Week 3)

### Day 10-11: Create Play Endpoint
- [ ] **Refactor** `create-play-record.ts` → `plays/create-play.ts`
  - [ ] Add `withOrgAuth('coach')` middleware
  - [ ] Require `orgId` in request
  - [ ] Upload file to Supabase Storage (if needed)
  - [ ] Create playbook_metadata with `org_id`
  - [ ] Create play record with `org_id`
  - [ ] Trigger background job
  - [ ] **Test** with valid org_id

### Day 12: List & Get Play Endpoints
- [ ] **Create** `plays/list-plays.ts`
  - [ ] Add `withOrgAuth('player')` (all roles)
  - [ ] Filter by `org_id`
  - [ ] Optionally filter by `team_id`, `status`, `content_type`
  - [ ] Players only see approved plays
  - [ ] Coaches/admins see all statuses
  - [ ] **Test** filtering

- [ ] **Create** `plays/get-play.ts`
  - [ ] Fetch single play by ID
  - [ ] Check org membership
  - [ ] Include assignments, flashcards if requested
  - [ ] **Test** with includes

### Day 13: Review Play Endpoint
- [ ] **Refactor** `review-play-content.ts` → `plays/review-play.ts`
  - [ ] Add `withOrgAuth('coach')` middleware
  - [ ] Validate play belongs to org
  - [ ] Apply updates (insights, assignments, flashcards)
  - [ ] Update play status (approved/rejected/pending_review)
  - [ ] **Test** all actions (approve, reject, update)

---

## Phase 5: Refactor Background Jobs (Week 3)

### Day 14: Split Background Processing
- [ ] **Refactor** `process-play-content-background.ts` → Split into:

  **Part 1: `plays/process-play-analysis-background.ts`**
  - [ ] Fetch play and metadata
  - [ ] Analyze with GPT-4o Vision or text
  - [ ] Insert play_assignments with `org_id` (via play)
  - [ ] Update play to "draft" status
  - [ ] Trigger flashcard generation
  - [ ] **Test** with uploaded image

  **Part 2: `flashcards/generate-flashcards-background.ts`**
  - [ ] Fetch play_assignments
  - [ ] Generate assignment flashcards (alignment, assignment, read)
  - [ ] Generate knowledge cards with GPT-4
  - [ ] Insert flashcard_templates with `org_id` (via play)
  - [ ] **Test** flashcard generation

---

## Phase 6: Refactor Flashcards API (Week 4)

### Day 15: Flashcard Endpoints
- [ ] **Create** `flashcards/list-flashcards.ts`
  - [ ] Add `withOrgAuth('coach')` middleware
  - [ ] Filter by `org_id`, `play_id`, `position`, `category`
  - [ ] Return flashcard question bank
  - [ ] **Test** filtering

- [ ] **Create** `flashcards/regenerate-flashcard.ts` (NEW)
  - [ ] Fetch existing flashcard
  - [ ] Check permissions
  - [ ] Regenerate with GPT-4 (custom prompt if provided)
  - [ ] Update flashcard_template
  - [ ] **Test** regeneration

---

## Phase 7: Update Frontend (Week 4-5)

### Day 16-17: Org Context Provider
- [ ] **Create** `src/contexts/OrgContext.tsx`
  ```typescript
  export const OrgProvider: React.FC = ({ children }) => {
    const [orgId, setOrgId] = useState<string | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [teamId, setTeamId] = useState<string | null>(null);
    // Fetch user's org memberships on mount
    // Allow user to switch orgs if multiple
  };
  ```
- [ ] **Integrate** into app layout
- [ ] **Update** all API calls to include `orgId`

### Day 18-19: Quiz Assignment UI (Coach View)
- [ ] **Create** `src/components/coach/QuizAssignmentForm.tsx`
  - [ ] Form to create quiz assignment
  - [ ] Flashcard selector (browse question bank)
  - [ ] Target selector (user, position, segment, team)
  - [ ] Settings (due date, passing score, max attempts)
  - [ ] Submit to `POST /api/quizzes/assignments`

- [ ] **Create** `src/components/coach/QuizAssignmentList.tsx`
  - [ ] List all quiz assignments for org
  - [ ] Show assignment status (active, completed, overdue)
  - [ ] Link to view results

- [ ] **Create** `src/components/coach/QuizResults.tsx`
  - [ ] List attempts per assignment
  - [ ] Show player scores and progress
  - [ ] Identify struggling players

### Day 20-21: Quiz Taking UI (Player View)
- [ ] **Create** `src/components/player/QuizList.tsx`
  - [ ] List assigned quizzes
  - [ ] Show due dates and attempt counts
  - [ ] Button to start quiz

- [ ] **Create** `src/components/player/QuizAttempt.tsx`
  - [ ] Display questions one by one
  - [ ] Multiple choice selection
  - [ ] Timer if time limit set
  - [ ] Submit answers

- [ ] **Create** `src/components/player/QuizResults.tsx`
  - [ ] Show score and pass/fail
  - [ ] Show correct vs user answers
  - [ ] XP earned notification

---

## Phase 8: Testing & Migration (Week 5)

### Day 22-23: Integration Testing
- [ ] **Test** complete workflow:
  1. Coach uploads playbook
  2. AI analyzes and generates flashcards
  3. Coach reviews and approves
  4. Coach creates quiz assignment
  5. Player sees assigned quiz
  6. Player takes quiz
  7. Player sees results
  8. Coach sees results

- [ ] **Test** role-based access:
  - [ ] Admin can do everything
  - [ ] Coach can create plays and quizzes
  - [ ] Player can only take quizzes and view approved plays

- [ ] **Test** multi-org isolation:
  - [ ] User in Org A cannot see Org B's plays
  - [ ] Quiz assignments respect org boundaries

### Day 24: Update Documentation
- [ ] **Update** API documentation
- [ ] **Create** user guides:
  - [ ] Coach: How to upload plays
  - [ ] Coach: How to create quiz assignments
  - [ ] Player: How to take quizzes
- [ ] **Update** README.md

### Day 25: Deprecate Old Endpoints
- [ ] **Mark** old endpoints as deprecated in code comments
- [ ] **Add** deprecation warnings in responses
- [ ] **Create** migration guide for API consumers
- [ ] **Schedule** removal date (e.g., 30 days)

---

## Phase 9: Deployment (Week 6)

### Day 26: Staging Deployment
- [ ] **Deploy** to staging environment
- [ ] **Run** full regression tests
- [ ] **Monitor** error logs
- [ ] **Fix** any issues found

### Day 27-28: Production Deployment
- [ ] **Backup** production database
- [ ] **Run** migration on production
- [ ] **Deploy** backend changes
- [ ] **Deploy** frontend changes
- [ ] **Monitor** application health
- [ ] **Watch** for errors and user feedback

### Day 29: Post-Deployment
- [ ] **Monitor** performance metrics
- [ ] **Collect** user feedback
- [ ] **Create** issues for any bugs found
- [ ] **Plan** improvements based on feedback

### Day 30: Retrospective
- [ ] **Review** what went well
- [ ] **Document** lessons learned
- [ ] **Plan** next features:
  - [ ] Advanced analytics
  - [ ] Quiz templates
  - [ ] Automated quiz scheduling
  - [ ] Spaced repetition algorithms

---

## Success Criteria

✅ **Functional Requirements**
- [ ] Coaches can upload plays and generate flashcards
- [ ] Coaches can create quiz assignments
- [ ] Players can take quizzes and see results
- [ ] All APIs are org-scoped
- [ ] RBAC is enforced at API and DB level

✅ **Non-Functional Requirements**
- [ ] No regression in existing functionality
- [ ] All API responses < 2 seconds (except background jobs)
- [ ] Zero data leakage between orgs
- [ ] Mobile-responsive UI for quiz taking
- [ ] 99.9% uptime during business hours

✅ **Quality Metrics**
- [ ] 90%+ test coverage on new endpoints
- [ ] Zero critical bugs in production
- [ ] < 5% error rate on API calls
- [ ] User satisfaction score > 4/5

---

## Quick Start Commands

### Run Database Migration
```bash
cd migrations
npx supabase db push
```

### Run Local Development
```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Start Netlify Functions dev server
netlify dev
```

### Test API Endpoints
```bash
# Example: Create quiz assignment
curl -X POST http://localhost:8888/api/quizzes/assignments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "orgId": "your-org-uuid",
    "title": "Week 3 QB Quiz",
    "assignedToPosition": "QB",
    "flashcardIds": ["uuid1", "uuid2"]
  }'
```

### Deploy to Production
```bash
# Deploy frontend
vercel --prod

# Deploy functions (handled by Netlify on git push)
git push origin main
```

---

## Resources

- [API Refactoring Plan](./API_REFACTORING_PLAN.md) - Full detailed plan
- [API Architecture Diagram](./API_ARCHITECTURE_DIAGRAM.md) - Visual workflows
- [Refined Schema](./schema_proposal_refined.sql) - Database schema
- [Migration Script](./migrations/migration_to_org_scoped.sql) - Migration SQL
- [TypeScript Types](./refined_database_types.ts) - Updated types

---

## Help & Support

If you encounter issues during implementation:

1. **Check logs** in Netlify Functions dashboard
2. **Verify** RLS policies are working with `EXPLAIN` queries
3. **Test** auth middleware with different user roles
4. **Review** error messages in Supabase dashboard

Good luck! 🚀
