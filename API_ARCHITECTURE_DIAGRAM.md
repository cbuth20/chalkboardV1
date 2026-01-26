# API Architecture Diagram
## Refactored Org-Scoped Workflow

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js)                            │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ Coach View   │  │ Player View  │  │ Admin View   │                 │
│  │              │  │              │  │              │                 │
│  │ • Upload     │  │ • Take Quiz  │  │ • Manage Org │                 │
│  │ • Review     │  │ • View Plays │  │ • Analytics  │                 │
│  │ • Assign Quiz│  │ • Progress   │  │ • Settings   │                 │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                 │
│         │                 │                 │                          │
│         └─────────────────┼─────────────────┘                          │
│                           │                                            │
│                  ┌────────▼────────┐                                   │
│                  │ Org Context     │                                   │
│                  │ (orgId, role)   │                                   │
│                  └────────┬────────┘                                   │
└───────────────────────────┼─────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    API LAYER (Netlify Functions)                        │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                     Auth Middleware                               │ │
│  │   withOrgAuth(role) → Verify org membership + role                │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                            │                                            │
│         ┌──────────────────┼──────────────────┐                        │
│         │                  │                  │                        │
│    ┌────▼────┐      ┌─────▼──────┐    ┌─────▼──────┐                 │
│    │ Plays   │      │ Flashcards │    │  Quizzes   │                 │
│    │  API    │      │    API     │    │    API     │                 │
│    └────┬────┘      └─────┬──────┘    └─────┬──────┘                 │
│         │                  │                  │                        │
└─────────┼──────────────────┼──────────────────┼─────────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE (PostgreSQL)                           │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ plays        │  │ flashcard_   │  │ quiz_        │                 │
│  │ (org_id FK)  │  │   templates  │  │  assignments │                 │
│  │              │  │ (org_id FK)  │  │ (org_id FK)  │                 │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                 │
│         │                  │                  │                        │
│         │  ┌───────────────┼──────────────────┘                        │
│         │  │               │                                           │
│  ┌──────▼──▼───┐    ┌─────▼──────┐    ┌──────────────┐               │
│  │ play_       │    │ quiz_      │    │ quiz_        │               │
│  │  assignments│    │  assignment│    │  attempts    │               │
│  │             │    │  _questions│    │              │               │
│  └─────────────┘    └────────────┘    └──────────────┘               │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                    RLS Policies (Org-Scoped)                     │ │
│  │  • is_org_member(org_id)                                         │ │
│  │  • is_org_staff(org_id) → admin or coach                         │ │
│  │  • has_org_role(org_id, role)                                    │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Workflow: Play Upload → Quiz Assignment

```
┌─────────────────────────────────────────────────────────────────────────┐
│  COACH: Upload Playbook                                                 │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  1. POST /api/plays                                                     │
│     • Upload file to Supabase Storage                                   │
│     • Create playbook_metadata (org_id, team_id, file_paths)            │
│     • Create play record (org_id, status: "generating")                 │
│     • Return playId immediately                                         │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            │ Trigger background job
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  2. BACKGROUND: process-play-analysis-background                        │
│     ⏱️  Timeout: 15 minutes                                              │
│                                                                         │
│     Step 1: Fetch play + metadata                                      │
│     Step 2: Analyze with GPT-4o Vision                                 │
│             • Extract positions, alignments, assignments, reads         │
│     Step 3: Insert play_assignments                                    │
│     Step 4: Update play (status: "draft")                              │
│     Step 5: Trigger flashcard generation                               │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            │ Trigger second background job
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  3. BACKGROUND: generate-flashcards-background                          │
│     ⏱️  Timeout: 15 minutes                                              │
│                                                                         │
│     Step 1: Fetch play_assignments                                     │
│     Step 2: Generate assignment flashcards                             │
│             • Alignment questions (multiple choice)                     │
│             • Assignment questions (multiple choice)                    │
│             • Read questions (multiple choice)                          │
│     Step 3: Generate knowledge cards with GPT-4                        │
│             • Concept questions                                         │
│             • Coverage adjustments                                      │
│     Step 4: Insert flashcard_templates (org_id via play.org_id)        │
│     Step 5: Mark generation complete                                   │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            │ Poll status
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  COACH: Review Generated Content                                        │
│  GET /api/plays/:playId?include=assignments,flashcards                  │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  4. POST /api/plays/:playId/review                                      │
│     Action: "approve" | "reject" | "update"                             │
│                                                                         │
│     • Approve → status: "approved", is_published: true                  │
│     • Reject → status: "rejected", is_published: false                  │
│     • Update → Apply edits, status: "pending_review"                    │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            │ If approved
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  COACH: Browse Question Bank                                            │
│  GET /api/flashcards?orgId=xxx&playId=yyy&position=QB                   │
│                                                                         │
│  Returns all flashcards that can be used in quizzes                    │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  5. COACH: Create Quiz Assignment                                       │
│  POST /api/quizzes/assignments                                          │
│  {                                                                      │
│    "orgId": "uuid",                                                     │
│    "title": "Week 3 QB Quiz",                                           │
│    "assignedToPosition": "QB",  // Target all QBs                       │
│    "dueDate": "2024-02-16T17:00:00Z",                                   │
│    "passingScore": 80,                                                  │
│    "maxAttempts": 3,                                                    │
│    "flashcardIds": ["uuid1", "uuid2", "uuid3", ...]                    │
│  }                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            │ Creates records:
                            │ • quiz_assignments
                            │ • quiz_assignment_questions (one per flashcard)
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  PLAYERS: View Assigned Quizzes                                         │
│  GET /api/quizzes/assignments?orgId=xxx&assignedToMe=true               │
│                                                                         │
│  [                                                                      │
│    {                                                                    │
│      "id": "uuid",                                                      │
│      "title": "Week 3 QB Quiz",                                         │
│      "dueDate": "2024-02-16T17:00:00Z",                                 │
│      "totalQuestions": 10,                                              │
│      "myAttempts": 1,                                                   │
│      "bestScore": 75                                                    │
│    }                                                                    │
│  ]                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  6. PLAYER: Start Quiz Attempt                                          │
│  POST /api/quizzes/attempts                                             │
│  { "quizAssignmentId": "uuid" }                                         │
│                                                                         │
│  Response:                                                              │
│  {                                                                      │
│    "attemptId": "uuid",                                                 │
│    "attemptNumber": 2,                                                  │
│    "questions": [                                                       │
│      {                                                                  │
│        "flashcardId": "uuid",                                           │
│        "question_prompt": "What is your assignment as the QB?",         │
│        "hints": ["Option A", "Option B", "Option C", "Option D"]       │
│      }                                                                  │
│    ]                                                                    │
│  }                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  7. PLAYER: Submit Quiz Attempt                                         │
│  POST /api/quizzes/attempts/:attemptId/submit                           │
│  {                                                                      │
│    "answers": [                                                         │
│      {                                                                  │
│        "flashcardId": "uuid",                                           │
│        "userAnswer": "Read high-low progression",                       │
│        "responseTimeMs": 3500                                           │
│      }                                                                  │
│    ]                                                                    │
│  }                                                                      │
│                                                                         │
│  Backend:                                                               │
│  • Grade each answer (check against correct_answer)                     │
│  • Calculate score percentage                                           │
│  • Determine pass/fail (score >= passingScore)                          │
│  • Award XP if passed                                                   │
│  • Update player_flashcard_progress (spaced repetition)                 │
│                                                                         │
│  Response:                                                              │
│  {                                                                      │
│    "scorePercentage": 85,                                               │
│    "passed": true,                                                      │
│    "correctAnswers": 8,                                                 │
│    "totalQuestions": 10,                                                │
│    "xpEarned": 150                                                      │
│  }                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  COACH: View Results & Analytics                                        │
│  GET /api/quizzes/attempts?orgId=xxx&quizAssignmentId=yyy               │
│                                                                         │
│  • See all player attempts                                              │
│  • Identify struggling players                                          │
│  • Track mastery over time                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Organization Context

```
┌─────────────────────────────────────────────────────────────────────────┐
│  User logs in → Supabase Auth                                           │
│  auth.uid() = "user-uuid"                                               │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Fetch user's org memberships                                           │
│                                                                         │
│  SELECT * FROM org_memberships                                          │
│  WHERE user_id = (                                                      │
│    SELECT id FROM users WHERE auth_id = auth.uid()                      │
│  ) AND is_active = true;                                                │
│                                                                         │
│  Result:                                                                │
│  [                                                                      │
│    {                                                                    │
│      "orgId": "org-1",                                                  │
│      "role": "coach",                                                   │
│      "teamId": "team-a"                                                 │
│    },                                                                   │
│    {                                                                    │
│      "orgId": "org-2",                                                  │
│      "role": "player",                                                  │
│      "teamId": "team-b",                                                │
│      "positionCode": "QB"                                               │
│    }                                                                    │
│  ]                                                                      │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Frontend: Org Context Provider                                         │
│  • User selects active organization (if multiple)                       │
│  • Store orgId, role, teamId in React context                           │
│  • All API calls include orgId                                          │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  API Request with Org Context                                           │
│                                                                         │
│  POST /api/plays                                                        │
│  Headers:                                                               │
│    Authorization: Bearer <supabase-jwt>                                 │
│  Body:                                                                  │
│    { "orgId": "org-1", "teamId": "team-a", ... }                        │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Backend: withOrgAuth('coach') Middleware                               │
│                                                                         │
│  1. Extract auth.uid() from JWT                                         │
│  2. Extract orgId from request body/query                               │
│  3. Query org_memberships:                                              │
│     WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())   │
│       AND org_id = :orgId                                               │
│       AND is_active = true                                              │
│                                                                         │
│  4. Check role:                                                         │
│     IF membership.role IN ('admin', 'coach') THEN                       │
│       ✅ Allow                                                           │
│     ELSE                                                                │
│       ❌ 403 Forbidden                                                   │
│     END IF                                                              │
│                                                                         │
│  5. Attach to request:                                                  │
│     req.user = { userId, orgId, role, teamId }                          │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Database Query with Org Scope                                          │
│                                                                         │
│  INSERT INTO plays (org_id, team_id, name, ...)                         │
│  VALUES (:orgId, :teamId, :name, ...);                                  │
│                                                                         │
│  RLS Policy: is_org_staff(plays.org_id)                                 │
│  ✅ Passes (user is coach in this org)                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Comparison: Before vs After

### Before (Team-Scoped)
```
┌──────────────────────┐
│ User → Team          │
└──────────────────────┘
          │
          ▼
┌──────────────────────┐
│ All APIs use team_id │
│ No org isolation     │
│ No RBAC enforcement  │
└──────────────────────┘
          │
          ▼
┌──────────────────────┐
│ plays (team_id)      │
│ flashcards (team_id) │
│ ❌ No quiz system     │
└──────────────────────┘

❌ Problems:
• Can't have multiple teams per org
• Can't differentiate between orgs
• No role-based permissions
• Flashcards exist but not assignable
```

### After (Org-Scoped)
```
┌────────────────────────────────────────┐
│ User → Org Membership (with role)      │
│         → Team (optional)              │
└────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│ All APIs use org_id                    │
│ RBAC middleware (admin/coach/player)   │
│ RLS policies at DB level               │
└────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│ plays (org_id, team_id)                │
│ flashcards (org_id via play)           │
│ quiz_assignments (org_id)              │
│ quiz_attempts (user_id)                │
└────────────────────────────────────────┘

✅ Benefits:
• Multi-org support in single DB
• Clear role-based permissions
• Complete quiz workflow
• Better data isolation
• Scalable architecture
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Background Job: process-play-analysis-background                       │
└─────────────────────────────────────────────────────────────────────────┘
          │
          ├─ Try: Analyze with GPT-4o Vision
          │    ├─ Success → Continue
          │    └─ Error (API failure, timeout, invalid image)
          │         │
          │         ├─ Log error with context
          │         ├─ Update play: status = "rejected"
          │         ├─ Store error message in review_notes
          │         └─ Return 500 error
          │
          ├─ Try: Insert play_assignments
          │    ├─ Success → Continue
          │    └─ Error (DB constraint violation)
          │         │
          │         ├─ Rollback transaction
          │         ├─ Update play: status = "rejected"
          │         └─ Return 500 error
          │
          └─ Success: Update play to "draft" status
                │
                └─ Trigger next job: generate-flashcards-background
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Background Job: generate-flashcards-background                         │
└─────────────────────────────────────────────────────────────────────────┘
          │
          ├─ Try: Generate assignment flashcards
          │    ├─ Success → Continue
          │    └─ Error (No assignments found)
          │         │
          │         ├─ Log warning
          │         └─ Continue (not fatal)
          │
          ├─ Try: Generate knowledge cards with GPT-4
          │    ├─ Success → Continue
          │    └─ Error (API failure)
          │         │
          │         ├─ Log error
          │         └─ Continue with empty knowledge cards (not fatal)
          │
          └─ Try: Insert flashcard_templates
               ├─ Success → Mark complete
               └─ Error (DB error)
                    │
                    ├─ Log error
                    ├─ Partial insert is OK (at least some flashcards saved)
                    └─ Play remains in "draft" status for review
```
